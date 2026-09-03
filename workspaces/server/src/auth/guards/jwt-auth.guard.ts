import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt', 'headerapikey']) {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (!isPublic) return (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest();

    if (request?.headers?.authorization) {
      await (super.canActivate(context) as Promise<boolean>).catch(() => false);
    }

    return true;
  }
}
