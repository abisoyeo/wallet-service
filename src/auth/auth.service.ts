import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from 'src/users/user.schema';
import { ApiKey } from 'src/api-key/api-key.schema';
import { AuthUser } from './interfaces/auth-user.interface';
import { RevokedToken } from './revoked-token.schema';
import { Identity } from 'src/common/interfaces/identity.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>,
    @InjectModel(RevokedToken.name)
    private revokedTokenModel: Model<RevokedToken>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.generateToken(user);
  }

  async signup(email, password) {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ email, password: hashed });

    const obj = user.toObject();

    const safeUser: AuthUser = {
      _id: obj._id.toString(),
      email: obj.email,
    };

    return this.generateToken(safeUser);
  }

  async logout(identity: Identity, token: string) {
    if (identity.type === 'user') {
      return this.revokeJwt(token);
    }
    if (identity.type === 'service') {
      if (!identity.serviceId) {
        throw new Error('Missing serviceId for service identity.');
      }
      return this.revokeApiKey(identity.serviceId);
    }
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

  private async revokeJwt(token: string) {
    const decoded = this.jwtService.decode(token) as any;

    // save jti to blacklist
    await this.revokedTokenModel.create({
      jti: decoded.jti,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'User logged out — token revoked' };
  }

  private async revokeApiKey(serviceId: string) {
    await this.apiKeyModel.updateOne(
      { _id: serviceId },
      { $set: { isActive: false } },
    );

    return { message: 'Service logged out — API key revoked' };
  }

  async validateUser(email: string, pass: string): Promise<AuthUser> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const obj = user.toObject();

    const safeUser: AuthUser = {
      _id: obj._id.toString(),
      email: obj.email,
    };

    return safeUser;
  }

  private generateToken(user: AuthUser) {
    const payload = {
      sub: user._id,
      email: user.email,
      jti: crypto.randomUUID(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id.toString(),
        email: user.email,
      },
    };
  }
}
