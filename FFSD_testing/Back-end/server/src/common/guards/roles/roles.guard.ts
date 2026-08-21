import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

const VALID_ROLES = ['citizen', 'officer', 'supervisor', 'superuser'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const allowedRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['role'];

    if (!userRole || !VALID_ROLES.includes(userRole)) {
      return false;
    }

    return allowedRoles.includes(userRole);
  }
}
