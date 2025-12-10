import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  Get,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateApiKeyDto } from 'src/api-key/dto/create-api-key.dto';
import { RolloverApiKeyDto } from 'src/api-key/dto/rollover-api-key.dto';
import { ApiKeyService } from './keys.service';

@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private keyService: ApiKeyService) {}

  @Post('create')
  async createKey(@Request() req, @Body() dto: CreateApiKeyDto) {
    const userId = req.user.userId;
    return this.keyService.createApiKey(userId, dto);
  }

  @Post('rollover')
  async rolloverKey(@Request() req, @Body() dto: RolloverApiKeyDto) {
    const userId = req.user.userId;
    return this.keyService.rolloverApiKey(userId, dto);
  }

  @Post(':id/revoke')
  async revokeKey(@Param('id') keyPrefix: string) {
    return this.keyService.revokeKey(keyPrefix);
  }

  @Get()
  async getKeys(@Request() req) {
    const userId = req.user.userId;

    return this.keyService.getKeys(userId);
  }

  @Delete(':id')
  async deleteKey(@Param('id') id: string) {
    return this.keyService.deleteKey(id);
  }
}
