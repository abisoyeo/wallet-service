import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Identity } from '../interfaces/identity.interface';

export const CurrentIdentity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Identity => {
    const request = ctx.switchToHttp().getRequest();
    // Returns { type: 'user' | 'service', ...data }
    return request.user as Identity;
  },
);
