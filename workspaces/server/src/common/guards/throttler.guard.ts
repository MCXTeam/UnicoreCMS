import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import * as requestIp from 'request-ip';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { Permission } from 'unicore-common';

@Injectable()
export class ThrottlerCoreGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip || requestIp.getClientIp(req);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (
      user &&
      (await matchPermission(
        [[Permission.KernelUnicoreConnect, Permission.KernelUnicoreProvider, Permission.AdminDashboard], { or: true }],
        { user },
      ))
    )
      return true;

    return false;
  }
}
