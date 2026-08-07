import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { ALLOW_INACTIVE_KEY, IS_PUBLIC_KEY } from 'src/common/constants';

@Injectable()
export class ActivatedGuard implements CanActivate {
  constructor(private reflector: Reflector, private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (skip) return true;

    const allowInactive = this.reflector.getAllAndOverride<boolean>(ALLOW_INACTIVE_KEY, [context.getHandler(), context.getClass()]);

    if (allowInactive) return true;

    const user = context.switchToHttp().getRequest()?.user;

    if (!user || user.activated || user.superuser) return true;

    const cfg = await this.configService.load();

    if (!cfg[ConfigField.EmailActivationRequired]) return true;

    throw new ForbiddenException('email_not_activated');
  }
}
