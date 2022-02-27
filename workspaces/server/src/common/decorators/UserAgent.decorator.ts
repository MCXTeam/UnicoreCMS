import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const userAgent = ctx.switchToHttp().getRequest().headers['user-agent'];
  return userAgent;
});
