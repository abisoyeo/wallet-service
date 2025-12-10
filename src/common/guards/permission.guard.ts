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

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userOrService = request.user;

    if (!userOrService) {
      throw new ForbiddenException('Authentication required');
    }

    // If it's a user (JWT), they usually have full access
    if (userOrService.type === 'user') {
      return true;
    }

    // If it's an API Key, check permissions array
    if (userOrService.type === 'service') {
      const userPermissions = userOrService.permissions || [];

      const hasPermission = requiredPermissions.every((p) =>
        userPermissions.includes(p),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient API Key permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
      return true;
    }

    return false;
  }
}
