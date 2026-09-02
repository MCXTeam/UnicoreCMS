import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { clientIp, RECAPTCHA_FAILED, RECAPTCHA_HEADER, RECAPTCHA_KEY } from '@common';
import { LoginAttemptsService } from '../attempts/login-attempts.service';
import { RecaptchaOptions } from './recaptcha.decorator';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly recaptcha: RecaptchaService,
    private readonly loginAttempts: LoginAttemptsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.recaptcha.configured) return true;

    const options = this.reflector.getAllAndOverride<RecaptchaOptions>(RECAPTCHA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return true;

    const request = context.switchToHttp().getRequest();

    if (await this.loginAttempts.skipCaptcha(request)) return true;

    const token = String(request.headers?.[RECAPTCHA_HEADER] ?? '');

    if (!(await this.recaptcha.verify(token, options.action, clientIp(request)))) throw new BadRequestException(RECAPTCHA_FAILED);

    return true;
  }
}
