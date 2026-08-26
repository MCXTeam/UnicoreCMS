import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { clientIp } from '../utils/ip';

@Injectable()
export class ThrottlerCoreGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return clientIp(req);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (
      user &&
      (await matchPermission(
        [['kernel.connect', 'kernel.provider', 'panel.access'], { or: true }],
        { user },
      ))
    )
      return true;

    return false;
  }
}
