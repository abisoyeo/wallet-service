// src/app.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { CurrentIdentity } from './common/decorators/current-identity.decorator';
import { SignupDto } from './auth/dto/signup.dto';
import { LoginDto } from './auth/dto/login.dto';
import { CreateApiKeyDto } from './keys/dto/create-api-key.dto';
import type { Identity } from './common/interfaces/identity.interface';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post('auth/signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('auth/login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  // Protected: Only a logged-in User (admin) can create keys for services
  @UseGuards(AuthGuard('jwt'))
  @Post('keys/create')
  async createKey(@Body() body: CreateApiKeyDto) {
    return this.authService.createApiKey(body.serviceName);
  }

  // 4. The Hybrid Protected Route
  // This route accepts EITHER a Bearer Token OR an API Key
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
  getServiceData() {
    return { message: 'This is specific to microservice communication' };
  }
}
