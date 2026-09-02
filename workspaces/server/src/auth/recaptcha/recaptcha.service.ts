import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { envConfig } from 'unicore-common';
import { RECAPTCHA_TIMEOUT_MS, RECAPTCHA_VERIFY_URL } from '@common';

interface SiteverifyResponse {
  success?: boolean;
  action?: string;
  score?: number;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  constructor(private httpService: HttpService) {}

  get configured(): boolean {
    return Boolean(envConfig.recaptchaSecret);
  }

  async verify(token: string, action: string, remoteIp?: string): Promise<boolean> {
    if (!token) return false;

    const body = new URLSearchParams({ secret: envConfig.recaptchaSecret, response: token });

    if (remoteIp) body.set('remoteip', remoteIp);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<SiteverifyResponse>(RECAPTCHA_VERIFY_URL, body.toString(), {
          timeout: RECAPTCHA_TIMEOUT_MS,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      if (!data?.success) {
        this.logger.warn(`Проверка капчи не пройдена: ${(data?.['error-codes'] ?? []).join(', ') || 'без кода'}`);

        return false;
      }

      return !data.action || data.action === action;
    } catch (e) {
      this.logger.warn(`Проверка капчи недоступна: ${e}`);

      return false;
    }
  }
}
