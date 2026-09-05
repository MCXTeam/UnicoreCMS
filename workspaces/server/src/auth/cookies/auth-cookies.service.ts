import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import ms from 'ms';
import { envConfig } from 'unicore-common';
import {
  COOKIE_PATH,
  COOKIE_SAMESITE_CROSS_SITE,
  COOKIE_SAMESITE_SAME_ORIGIN,
  CSRF_COOKIE,
  CSRF_HEADER,
  CSRF_TOKEN_BYTES,
  REFRESH_COOKIE,
  cookieValue,
  safeEqual,
} from '@common';

@Injectable()
export class AuthCookiesService {
  private get sameSite(): 'lax' | 'none' {
    return envConfig.apiHttps ? COOKIE_SAMESITE_CROSS_SITE : COOKIE_SAMESITE_SAME_ORIGIN;
  }

  private get maxAge(): number {
    return ms(envConfig.jwtRefreshExpires as ms.StringValue);
  }

  issue(response: Response, refreshToken: string, request?: Request): void {
    const shared = { sameSite: this.sameSite, secure: envConfig.apiHttps, path: COOKIE_PATH, maxAge: this.maxAge } as const;
    const csrf = (request && this.token(request)) || randomBytes(CSRF_TOKEN_BYTES).toString('hex');

    response.cookie(REFRESH_COOKIE, refreshToken, { ...shared, httpOnly: true });
    response.cookie(CSRF_COOKIE, csrf, { ...shared, httpOnly: false });
  }

  clear(response: Response): void {
    const shared = { sameSite: this.sameSite, secure: envConfig.apiHttps, path: COOKIE_PATH } as const;

    response.clearCookie(REFRESH_COOKIE, { ...shared, httpOnly: true });
    response.clearCookie(CSRF_COOKIE, { ...shared, httpOnly: false });
  }

  refreshToken(request: Request): string {
    return cookieValue(request, REFRESH_COOKIE);
  }

  present(request: Request): boolean {
    return Boolean(this.refreshToken(request));
  }

  token(request: Request): string {
    return cookieValue(request, CSRF_COOKIE);
  }

  assertCsrf(request: Request): void {
    const cookie = cookieValue(request, CSRF_COOKIE);
    const header = String(request.headers[CSRF_HEADER] ?? '');

    if (!cookie || !header || !safeEqual(cookie, header)) throw new ForbiddenException();
  }

  resolve(request: Request, fallback?: string): string {
    const fromCookie = this.refreshToken(request);

    if (!fromCookie) {
      if (!fallback) throw new UnauthorizedException();

      return fallback;
    }

    this.assertCsrf(request);

    return fromCookie;
  }
}
