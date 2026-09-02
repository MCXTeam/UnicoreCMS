import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { envConfig } from 'unicore-common';
import {
  AUTH_LOGIN_PATH,
  CacheKey,
  LOGIN_ATTEMPT_ANONYMOUS_SOURCE,
  LOGIN_ATTEMPT_BLOCK_AFTER,
  LOGIN_ATTEMPT_BLOCK_AFTER_CAPTCHA,
  LOGIN_ATTEMPT_CAPTCHA_AFTER,
  LOGIN_ATTEMPT_COOLDOWN_BASE_MS,
  LOGIN_ATTEMPT_COOLDOWN_MAX_MS,
  LOGIN_ATTEMPT_FIELD,
  LOGIN_ATTEMPT_WINDOW_MS,
  TooManyAttemptsException,
  clientIp,
  requestBodyString,
  requestPath,
} from '@common';
import { LoginAttemptState } from './login-attempt-state';

@Injectable()
export class LoginAttemptsService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private key(account: string, source: string): string {
    const owner = String(account ?? '')
      .trim()
      .toLowerCase();

    return `${CacheKey.LoginAttempts}:${owner}:${source || LOGIN_ATTEMPT_ANONYMOUS_SOURCE}`;
  }

  private get blockAfter(): number {
    return envConfig.recaptchaSecret ? LOGIN_ATTEMPT_BLOCK_AFTER_CAPTCHA : LOGIN_ATTEMPT_BLOCK_AFTER;
  }

  private cooldown(count: number): number {
    const over = count - this.blockAfter;

    if (over < 0) return 0;

    return Math.min(LOGIN_ATTEMPT_COOLDOWN_BASE_MS * 2 ** over, LOGIN_ATTEMPT_COOLDOWN_MAX_MS);
  }

  private async state(account: string, source: string): Promise<LoginAttemptState | null> {
    return (await this.cacheManager.get<LoginAttemptState>(this.key(account, source))) ?? null;
  }

  async count(account: string, source: string): Promise<number> {
    return (await this.state(account, source))?.count ?? 0;
  }

  async assert(account: string, source: string): Promise<void> {
    const state = await this.state(account, source);
    const remaining = state ? state.until - Date.now() : 0;

    if (remaining > 0) throw new TooManyAttemptsException(Math.ceil(remaining / 1000));
  }

  async fail(account: string, source: string): Promise<void> {
    const count = (await this.count(account, source)) + 1;
    const cooldown = this.cooldown(count);
    const state: LoginAttemptState = { count, until: Date.now() + cooldown };

    await this.cacheManager.set(this.key(account, source), state, Math.max(LOGIN_ATTEMPT_WINDOW_MS, cooldown));
  }

  async succeed(account: string, source: string): Promise<void> {
    await this.cacheManager.del(this.key(account, source));
  }

  async skipCaptcha(request: unknown): Promise<boolean> {
    if (!envConfig.recaptchaSecret) return true;

    const req = (request ?? {}) as Record<string, any>;

    if (requestPath(req) !== AUTH_LOGIN_PATH) return false;

    return (await this.count(requestBodyString(req, LOGIN_ATTEMPT_FIELD), clientIp(req))) < LOGIN_ATTEMPT_CAPTCHA_AFTER;
  }
}
