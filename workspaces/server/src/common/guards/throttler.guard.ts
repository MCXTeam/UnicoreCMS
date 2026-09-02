import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { KERNEL_PERMISSIONS } from 'unicore-common';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { LAUNCHER_CONTEXT_FIELD, LAUNCHER_IP_FIELD, THROTTLE_LOGIN_FIELD, THROTTLE_LOGIN_TRACKER_PREFIX, THROTTLE_UNSKIPPABLE_PREFIX } from '../constants';
import { clientIp, normalizeIp } from '../utils/ip';
import { requestBodyString, requestPath } from '../utils/request';

@Injectable()
export class ThrottlerCoreGuard extends ThrottlerGuard {
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
