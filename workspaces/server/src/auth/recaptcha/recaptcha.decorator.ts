import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RECAPTCHA_KEY } from '@common';
import { RecaptchaGuard } from './recaptcha.guard';

export interface RecaptchaOptions {
  action: string;
}

export const Recaptcha = (options: RecaptchaOptions) =>
  applyDecorators(SetMetadata(RECAPTCHA_KEY, options), UseGuards(RecaptchaGuard));
