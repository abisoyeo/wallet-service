import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentIdentity } from 'src/common/decorators/current-identity.decorator';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import type { Identity } from 'src/common/interfaces/identity.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req) {
    const user = await this.authService.validateGoogleUser(req.user);

    return this.authService.loginWithProvider(user);
  }

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentIdentity() identity: Identity, @Req() req: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    return this.authService.logout(identity, token);
  }
}
