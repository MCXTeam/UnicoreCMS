import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LOCALE_HEADER } from 'unicore-common';

export const Locale = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  return String(ctx.switchToHttp().getRequest().headers[LOCALE_HEADER] || '') || null;
});
