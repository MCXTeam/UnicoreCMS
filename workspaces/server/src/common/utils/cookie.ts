import { COOKIE_PAIR_SEPARATOR, COOKIE_VALUE_SEPARATOR } from '../constants';

export function parseCookies(header?: string): Record<string, string> {
  const jar: Record<string, string> = {};

  if (!header) return jar;

  for (const pair of header.split(COOKIE_PAIR_SEPARATOR)) {
    const index = pair.indexOf(COOKIE_VALUE_SEPARATOR);

    if (index < 1) continue;

    const name = pair.slice(0, index).trim();

    if (!name || jar[name] !== undefined) continue;

    try {
      jar[name] = decodeURIComponent(pair.slice(index + 1).trim());
    } catch {
      jar[name] = pair.slice(index + 1).trim();
    }
  }

  return jar;
}

export function cookieValue(request: { headers?: Record<string, any>; cookies?: Record<string, string> }, name: string): string {
  if (request.cookies?.[name]) return request.cookies[name];

  return parseCookies(request.headers?.cookie)[name] ?? '';
}
