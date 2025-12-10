import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const userOrService = request.user; // This comes from ApiKeyStrategy

    // If it's a user (JWT), they usually have full access, or you check their roles
    if (userOrService.type === 'user') return true;

    // If it's an API Key, check permissions array
    if (userOrService.type === 'service') {
      const hasPermission = requiredPermissions.every((p) =>
        userOrService.permissions.includes(p),
      );
      if (!hasPermission)
        throw new ForbiddenException('Insufficient API Key permissions');
      return true;
    }

    return false;
  }
}
