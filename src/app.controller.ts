import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
  Req,
  HttpStatus,
  HttpCode,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { CurrentIdentity } from './common/decorators/current-identity.decorator';
import { SignupDto } from './auth/dto/signup.dto';
import { LoginDto } from './auth/dto/login.dto';
import { CreateApiKeyDto } from './api-key/dto/create-api-key.dto';
import type { Identity } from './common/interfaces/identity.interface';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post('auth/signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('keys/create')
  async createKey(@Body() body: CreateApiKeyDto) {
    return this.authService.createApiKey(body.serviceName);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('keys/revoke/:id')
  async revokeKey(@Param('id') id: string) {
    return this.authService.revokeKey(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('keys')
  async getKeys() {
    return this.authService.getKeys();
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('keys/:id')
  async deleteKey(@Param('id') id: string) {
    return this.authService.deleteKey(id);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('protected/hybrid')
  getHybridData(@CurrentIdentity() identity: Identity) {
    if (identity.type === 'service') {
      return `Hello Service: ${identity.serviceName}`;
    }
    return `Hello User: ${identity.email}`;
  }

  @UseGuards(AuthGuard('api-key'))
  @Get('protected/service-only')
  getServiceData(@CurrentIdentity() identity: Identity) {
    return {
      message: `Hello from ${identity.serviceName}`,
      serviceId: identity.serviceId,
      type: identity.type,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('protected/user-only')
  getUserData(@CurrentIdentity() identity: Identity) {
    return {
      message: `Hello from ${identity.email}`,
      userId: identity.userId,
      type: identity.type,
    };
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @HttpCode(HttpStatus.OK)
  @Post('auth/logout')
  async logout(@CurrentIdentity() identity: Identity, @Req() req: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    return this.authService.logout(identity, token);
  }
}
