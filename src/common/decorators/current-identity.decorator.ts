import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentIdentity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Returns { type: 'user' | 'service', ...data }
    return request.user;
  },
);
