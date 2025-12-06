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

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  // 1. User Signup
  @Post('auth/signup')
  async signup(@Body() body) {
    return this.authService.signup(body.email, body.password);
  }

  // 2. User Login
  @Post('auth/login')
  async login(@Body() body) {
    // Skipping password validation logic for brevity
    return this.authService.login({ email: body.email, id: 1 });
  }

  // 3. Generate API Keys
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
  getHybridData(@Request() req) {
    return {
      message: 'Access Granted',
      identityType: req.user.type, // 'user' or 'service'
      data: req.user,
    };
  }

  // 5. Service-Only Route
  @UseGuards(AuthGuard('api-key'))
  @Get('protected/service-only')
  getServiceData() {
    return { message: 'This is specific to microservice communication' };
  }
}
