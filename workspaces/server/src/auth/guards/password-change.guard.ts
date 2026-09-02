import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_PASSWORD_PENDING_KEY, IS_PUBLIC_KEY, PASSWORD_CHANGE_REQUIRED } from 'src/common/constants';

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (skip) return true;

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_PENDING_KEY, [context.getHandler(), context.getClass()]);

    if (allowed) return true;

    if (!context.switchToHttp().getRequest()?.user?.password_change_required) return true;

    throw new ForbiddenException(PASSWORD_CHANGE_REQUIRED);
  }
}
