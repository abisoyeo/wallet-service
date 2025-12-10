import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { ApiKeyService } from 'src/api-key/keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private keyService: ApiKeyService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }
    const record = await this.keyService.validateApiKey(apiKey);
    if (!record) {
      throw new UnauthorizedException('Invalid or expired API key');
    }
    return {
      type: 'service',
      serviceId: record._id.toString(),
      keyPrefix: record.keyPrefix,
      isActive: record.isActive,
      expiresAt: record.expiresAt,
      name: record.name,
    };
  }
}
