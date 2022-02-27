import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import * as requestIp from 'request-ip';

@Injectable()
export class ThrottlerCoreGuard extends ThrottlerGuard {
  protected getTracker(req: any): string {
    return requestIp.getClientIp(req);
  }
}
