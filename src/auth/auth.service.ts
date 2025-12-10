import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
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
import { ApiKeyService } from 'src/api-key/keys.service';

@Injectable()
export class AuthService {
  constructor(
    private apiKeyService: ApiKeyService,
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

  async loginWithProvider(user: any) {
    const safeUser: AuthUser = {
      _id: user._id.toString(),
      email: user.email,
    };
    return this.generateToken(safeUser);
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

  async validateGoogleUser(googleUser: any) {
    const { email, googleId, firstName, lastName, picture } = googleUser;

    const user = await this.userModel.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      return user;
    }

    const newUser = new this.userModel({
      email,
      googleId,
      firstName,
      lastName,
      picture,
    });

    return newUser.save();
  }

  async logout(identity: Identity, token: string) {
    if (identity.type === 'user') {
      return this.revokeJwt(token);
    }
    if (identity.type === 'service') {
      if (!identity.serviceId) {
        throw new Error('Missing serviceId for service identity.');
      }
      return this.apiKeyService.revokeKey(identity.serviceId);
    }
  }

  private async revokeJwt(token: string) {
    const decoded = this.jwtService.decode(token) as any;

    await this.revokedTokenModel.create({
      jti: decoded.jti,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return { message: 'User logged out — token revoked' };
  }

  async validateUser(email: string, pass: string): Promise<AuthUser> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.password) {
      throw new UnauthorizedException(
        'Account created via Google. Please sign in with Google.',
      );
    }

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
