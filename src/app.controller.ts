// src/app.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { CurrentIdentity } from './common/decorators/current-identity.decorator';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Post('auth/signup')
  async signup(@Body() body) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('auth/login')
  async login(@Body() body) {
    return this.authService.login({ email: body.email, id: 1 });
  }

  // Protected: Only a logged-in User (admin) can create keys for services
  @UseGuards(AuthGuard('jwt'))
  @Post('keys/create')
  async createKey(@Body() body) {
    return this.authService.createApiKey(body.serviceName);
  }

  // 4. The Hybrid Protected Route
  // This route accepts EITHER a Bearer Token OR an API Key
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('protected/hybrid')
  getHybridData(@CurrentIdentity() identity) {
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
