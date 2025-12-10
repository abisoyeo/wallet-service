import { Controller, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentIdentity } from './common/decorators/current-identity.decorator';
import type { Identity } from './common/interfaces/identity.interface';

@Controller()
export class AppController {
  constructor() {}

  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('protected/hybrid')
  getHybridData(@CurrentIdentity() identity: Identity) {
    if (identity.type === 'service') {
      return `Hello Service: ${identity.name}`;
    }
    return `Hello User: ${identity.email}`;
  }

  @UseGuards(AuthGuard('api-key'))
  @Get('protected/service-only')
  getServiceData(@CurrentIdentity() identity: Identity) {
    return {
      message: `Hello from ${identity.name}`,
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
}
