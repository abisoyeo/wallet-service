import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpStatus,
  HttpCode,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentIdentity } from 'src/common/decorators/current-identity.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateApiKeyDto } from 'src/api-key/dto/create-api-key.dto';
import type { Identity } from 'src/common/interfaces/identity.interface';

@Controller('auth')
export class AppController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    const user = await this.authService.validateGoogleUser(req.user);

    return this.authService.loginWithProvider(user);
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
  @HttpCode(HttpStatus.OK)
  @Post('auth/logout')
  async logout(@CurrentIdentity() identity: Identity, @Req() req: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    return this.authService.logout(identity, token);
  }
}
