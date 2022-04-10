import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import * as requestIp from 'request-ip';
import { User } from 'src/admin/users/entities/user.entity';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { Permission } from 'unicore-common';

@Injectable()
export class ThrottlerCoreGuard extends ThrottlerGuard {
  protected getTracker(req: any): string {
    return requestIp.getClientIp(req);
  }

  protected async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const user = req.user as User
    const ip = this.getTracker(req)

    if (ip == "127.0.0.1")
      return true

    if (user && matchPermission([[Permission.KernelUnicoreConnect, Permission.KernelUnicoreProvider, Permission.AdminDashboard], { or: true }], { user }))
      return true

    const key = this.generateKey(context, ip);
    const ttls = await this.storageService.getRecord(key);

    if (ttls.length >= limit) {
      throw new ThrottlerException();
    }

    await this.storageService.addRecord(key, ttl);
    return true;
  }
}
