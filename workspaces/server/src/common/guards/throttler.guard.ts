import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KERNEL_PERMISSIONS } from 'unicore-common';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import {
  LAUNCHER_CONTEXT_FIELD,
  LAUNCHER_IP_FIELD,
  THROTTLE_DEFAULT,
  THROTTLE_KEY,
  THROTTLE_LOGIN_FIELD,
  THROTTLE_LOGIN_TRACKER_PREFIX,
  THROTTLE_SKIP_KEY,
  THROTTLE_UNSKIPPABLE_PREFIX,
} from '../constants';
import { TooManyAttemptsException } from '../exceptions/too-many-attempts.exception';
import { ThrottleOptions } from '../throttler/throttle.decorator';
import { ThrottlerService } from '../throttler/throttler.service';
import { clientIp, normalizeIp } from '../utils/ip';
import { requestBodyString, requestPath } from '../utils/request';

@Injectable()
export class ThrottlerCoreGuard implements CanActivate {
  constructor(protected readonly reflector: Reflector, protected readonly throttler: ThrottlerService) {}

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return clientIp(req);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) return false;
    if (requestPath(req).toLowerCase().startsWith(THROTTLE_UNSKIPPABLE_PREFIX)) return false;

    return matchPermission([KERNEL_PERMISSIONS, { or: true }], { user });
  }

  private options(context: ExecutionContext): ThrottleOptions {
    return (
      this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [context.getHandler(), context.getClass()]) ??
      THROTTLE_DEFAULT
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(THROTTLE_SKIP_KEY, [context.getHandler(), context.getClass()])) return true;
    if (await this.shouldSkip(context)) return true;

    const { ttl, limit } = this.options(context);
    const scope = `${context.getClass().name}.${context.getHandler().name}`;
    const tracker = await this.getTracker(context.switchToHttp().getRequest());
    const { count, resetAt } = await this.throttler.hit(scope, tracker, ttl);

    if (count > limit) throw new TooManyAttemptsException(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)));

    return true;
  }
}

@Injectable()
export class LauncherThrottlerGuard extends ThrottlerCoreGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = normalizeIp(requestBodyString(req.body?.[LAUNCHER_CONTEXT_FIELD], LAUNCHER_IP_FIELD));
    const login = requestBodyString(req.body, THROTTLE_LOGIN_FIELD).toLowerCase();

    if (login) return `${THROTTLE_LOGIN_TRACKER_PREFIX}${login}:${forwarded || clientIp(req)}`;

    return forwarded || clientIp(req);
  }
}
