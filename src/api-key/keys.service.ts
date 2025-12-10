import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey } from './api-key.schema';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>) {}

  async revokeKey(keyPrefix: string) {
    await this.apiKeyModel.updateOne(
      { keyPrefix: keyPrefix },
      { $set: { isActive: false } },
    );

    return {
      message: `API key with prefix ${keyPrefix} successfully revoked`,
    };
  }

  async getKeys(userId: string) {
    const keys = await this.apiKeyModel
      .find({ userId, isRevoked: false })
      .select('-keyHash')
      .sort({ createdAt: -1 });

    if (!keys || keys.length === 0) {
      return {
        message: 'No API keys found',
        data: [],
      };
    }

    return {
      message: `${keys.length} API key(s) retrieved successfully`,
      data: keys,
    };
  }

  async deleteKey(id: string) {
    const result = await this.apiKeyModel.deleteOne({ keyPrefix: id });

    if (result.deletedCount === 0) {
      return { message: `API key with prefix ${id} not found` };
    }

    return {
      message: `API key with prefix ${id} successfully deleted`,
    };
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
    const activeCount = await this.apiKeyModel.countDocuments({
      owner: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (activeCount >= 5) {
      throw new ConflictException(
        'Limit reached: Maximum 5 active API keys allowed per user.',
      );
    }
    const existing = await this.apiKeyModel.findOne({ name: dto.name });
    if (existing) throw new ConflictException('Service name already in use');

    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = rawKey.substring(0, 7);
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiryDate(dto.expiry);

    const newKey = new this.apiKeyModel({
      owner: userId,
      name: dto.name,
      permissions: dto.permissions,
      keyPrefix,
      keyHash: hashedKey,
      isActive: true,
      expiresAt,
    });

    await newKey.save();

    return {
      message: 'API key created successfully',
      permissions: newKey.permissions,
      name: newKey.name,
      key_prefix: newKey.keyPrefix,
      api_key: rawKey, // "sk_live_..." (Use a prefix helper if needed)
      expires_at: expiresAt,
      _id: newKey._id,
    };
  }

  async rolloverApiKey(userId: string, dto: RolloverApiKeyDto) {
    const oldKey = await this.apiKeyModel.findOne({
      _id: dto.expired_key_id,
      owner: userId,
    });

    if (!oldKey) {
      throw new NotFoundException('Key not found or does not belong to you.');
    }

    if (new Date() < oldKey.expiresAt) {
      throw new BadRequestException(
        'Key is not yet expired. Cannot rollover active keys.',
      );
    }

    const activeCount = await this.apiKeyModel.countDocuments({
      owner: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (activeCount >= 5) {
      throw new ConflictException(
        'Limit reached: Cannot create new key via rollover.',
      );
    }

    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = rawKey.substring(0, 7);
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiryDate(dto.expiry);

    const newKey = new this.apiKeyModel({
      owner: userId,
      name: oldKey.name,
      permissions: oldKey.permissions,
      keyPrefix,
      keyHash: hashedKey,
      isActive: true,
      expiresAt,
    });

    await newKey.save();

    return {
      message: 'Key rolled over successfully',
      api_key: rawKey,
      permissions: newKey.permissions,
      expires_at: expiresAt,
      _id: newKey._id,
    };
  }

  async validateApiKey(rawKey: string) {
    const prefix = rawKey.substring(0, 7);

    const apiKeyDoc = await this.apiKeyModel.findOne({ keyPrefix: prefix });

    if (!apiKeyDoc) return null;

    if (!apiKeyDoc.isActive) return null; // Revoked
    if (new Date() > apiKeyDoc.expiresAt) return null; // Expired

    const isMatch = await bcrypt.compare(rawKey, apiKeyDoc.keyHash);

    if (isMatch) {
      await this.apiKeyModel.updateOne(
        { _id: apiKeyDoc._id },
        { $set: { lastUsed: new Date() } },
      );
      return apiKeyDoc;
    }

    return null;
  }

  private calculateExpiryDate(shorthand: string): Date {
    const now = new Date();
    switch (shorthand) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}
