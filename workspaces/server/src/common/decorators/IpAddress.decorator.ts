import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { clientIp } from '../utils/ip';

export const IpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  return clientIp(ctx.switchToHttp().getRequest());
});
