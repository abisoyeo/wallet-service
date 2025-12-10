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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateApiKeyDto } from 'src/api-key/dto/create-api-key.dto';
import { RolloverApiKeyDto } from 'src/api-key/dto/rollover-api-key.dto';
import { ApiKeyService } from './keys.service';

@ApiTags('keys')
@ApiBearerAuth('access-token')
@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private keyService: ApiKeyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createKey(@Request() req, @Body() dto: CreateApiKeyDto) {
    const userId = req.user.userId;
    return this.keyService.createApiKey(userId, dto);
  }

  @Post('rollover')
  @ApiOperation({ summary: 'Rollover an expired API key' })
  @ApiResponse({ status: 201, description: 'API key rolled over successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rolloverKey(@Request() req, @Body() dto: RolloverApiKeyDto) {
    const userId = req.user.userId;
    return this.keyService.rolloverApiKey(userId, dto);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeKey(@Param('id') keyPrefix: string) {
    return this.keyService.revokeKey(keyPrefix);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for the current user' })
  @ApiResponse({ status: 200, description: 'A list of API keys' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKeys(@Request() req) {
    const userId = req.user.userId;

    return this.keyService.getKeys(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteKey(@Param('id') id: string) {
    return this.keyService.deleteKey(id);
  }
}
