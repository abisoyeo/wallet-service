import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { User, UserSchema } from 'src/users/user.schema';
import { ApiKey, ApiKeySchema } from 'src/api-key/api-key.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RevokedToken, RevokedTokenSchema } from './revoked-token.schema';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: RevokedToken.name, schema: RevokedTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  // controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiKeyStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
