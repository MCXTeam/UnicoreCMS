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

export interface LoginAttemptOwner {
  uuid?: string;
}

@Injectable()
export class LoginAttemptsService {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private normalize(account: string): string {
    return String(account ?? '')
      .trim()
      .toLowerCase();
  }

  private keys(account: string, source: string, owner?: LoginAttemptOwner): string[] {
    const scope = source || LOGIN_ATTEMPT_ANONYMOUS_SOURCE;

    return Array.from(new Set([this.normalize(account), owner?.uuid].filter(Boolean))).map(
      (identifier) => `${CacheKey.LoginAttempts}:${identifier}:${scope}`,
    );
  }

  private get blockAfter(): number {
    return envConfig.recaptchaSecret ? LOGIN_ATTEMPT_BLOCK_AFTER_CAPTCHA : LOGIN_ATTEMPT_BLOCK_AFTER;
  }

  private cooldown(count: number): number {
    const over = count - this.blockAfter;

    if (over < 0) return 0;

    return Math.min(LOGIN_ATTEMPT_COOLDOWN_BASE_MS * 2 ** over, LOGIN_ATTEMPT_COOLDOWN_MAX_MS);
  }

  private serial<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);

    this.queue = next.then(
      () => undefined,
      () => undefined,
    );

    return next;
  }

  private async bump(key: string): Promise<void> {
    const count = ((await this.cacheManager.get<LoginAttemptState>(key))?.count ?? 0) + 1;
    const cooldown = this.cooldown(count);
    const state: LoginAttemptState = { count, until: Date.now() + cooldown };

    await this.cacheManager.set(key, state, Math.max(LOGIN_ATTEMPT_WINDOW_MS, cooldown));
  }

  async count(account: string, source: string, owner?: LoginAttemptOwner): Promise<number> {
    const states = await Promise.all(
      this.keys(account, source, owner).map((key) => this.cacheManager.get<LoginAttemptState>(key)),
    );

    return Math.max(0, ...states.map((state) => state?.count ?? 0));
  }

  async assert(account: string, source: string, owner?: LoginAttemptOwner): Promise<void> {
    const states = await Promise.all(
      this.keys(account, source, owner).map((key) => this.cacheManager.get<LoginAttemptState>(key)),
    );
    const until = Math.max(0, ...states.map((state) => state?.until ?? 0));
    const remaining = until - Date.now();

    if (remaining > 0) throw new TooManyAttemptsException(Math.ceil(remaining / 1000));
  }

  async fail(account: string, source: string, owner?: LoginAttemptOwner): Promise<void> {
    const keys = this.keys(account, source, owner);

    await this.serial(async () => {
      for (const key of keys) await this.bump(key);
    });
  }

  async succeed(account: string, source: string, owner?: LoginAttemptOwner): Promise<void> {
    const keys = this.keys(account, source, owner);

    await this.serial(async () => {
      for (const key of keys) await this.cacheManager.del(key);
    });
  }

  async skipCaptcha(request: unknown): Promise<boolean> {
    if (!envConfig.recaptchaSecret) return true;

    const req = (request ?? {}) as Record<string, any>;

    if (requestPath(req).toLowerCase() !== AUTH_LOGIN_PATH) return false;

    return (await this.count(requestBodyString(req.body, LOGIN_ATTEMPT_FIELD), clientIp(req))) < LOGIN_ATTEMPT_CAPTCHA_AFTER;
  }
}
