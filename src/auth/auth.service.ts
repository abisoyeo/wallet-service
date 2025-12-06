import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from 'src/users/user.schema';
import { ApiKey } from 'src/keys/api-key.schema';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>,
  ) {}

  async validateUser(email: string, pass: string): Promise<AuthUser | null> {
    const user = await this.userModel.findOne({ email });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const obj = user.toObject();

      // Remove the password from the returned object
      const safeUser: AuthUser = {
        _id: obj._id.toString(),
        email: obj.email,
      };

      return safeUser;
    }

    return null;
  }

  login(user: AuthUser) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({ email, password: hashedPassword });
    return createdUser.save();
  }

  async createApiKey(serviceName: string) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = rawKey.substring(0, 7);
    const hashedKey = await bcrypt.hash(rawKey, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newKey = new this.apiKeyModel({
      keyPrefix,
      keyHash: hashedKey,
      serviceName,
      expiresAt,
    });

    await newKey.save();

    return { apiKey: rawKey, serviceName, expiresAt };
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
}
