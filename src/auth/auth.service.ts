// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  // In-memory DB for demo purposes
  private apiKeys: any[] = [];
  private users: any[] = [];

  constructor(private jwtService: JwtService) {}

  // --- User Logic ---
  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(email, password) {
    // Simple mock signup
    const newUser = { id: Date.now(), email, password };
    this.users.push(newUser);
    return newUser;
  }

  // --- API Key Logic ---
  async createApiKey(serviceName: string) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Set expiration for 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const keyRecord = {
      id: crypto.randomUUID(),
      keyPrefix: rawKey.substring(0, 7),
      keyHash: hashedKey,
      serviceName,
      isActive: true,
      expiresAt,
    };

    this.apiKeys.push(keyRecord);

    // RETURN THE RAW KEY ONLY ONCE
    return { apiKey: rawKey, ...keyRecord };
  }

  async validateApiKey(rawKey: string) {
    // In a real DB, you might search by prefix to optimize, or iterate
    // Since we can't search by hash, usually we store a "prefix" or "id" in the header too,
    // Or we just iterate (slow for large DBs) or use a secure indexable token.
    // For this demo, we will iterate our mock DB.

    for (const storedKey of this.apiKeys) {
      const isMatch = await bcrypt.compare(rawKey, storedKey.keyHash);

      if (isMatch) {
        if (!storedKey.isActive) return null; // Revoked
        if (new Date() > storedKey.expiresAt) return null; // Expired
        return storedKey;
      }
    }
    return null;
  }
}
