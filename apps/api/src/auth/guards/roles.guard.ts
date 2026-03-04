import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator = allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const account = request.user;

    if (!account?.accountType) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message_en: 'You do not have permission to access this resource',
        message_fr: "Vous n'avez pas la permission d'accéder à cette ressource",
      });
    }

    if (!requiredRoles.includes(account.accountType)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message_en: 'You do not have permission to access this resource',
        message_fr: "Vous n'avez pas la permission d'accéder à cette ressource",
      });
    }

    return true;
  }
}
