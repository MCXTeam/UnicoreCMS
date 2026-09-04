export const REFRESH_COOKIE = "unicore_refresh";
export const CSRF_COOKIE = "unicore_csrf";
export const CSRF_HEADER = "x-csrf-token";
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_VALUE_SEPARATOR = "=";

export function readCookie(header: string, name: string): string {
  for (const pair of String(header ?? "").split(COOKIE_PAIR_SEPARATOR)) {
    const index = pair.indexOf(COOKIE_VALUE_SEPARATOR);

    if (index < 1) continue;
    if (pair.slice(0, index).trim() !== name) continue;

    try {
      return decodeURIComponent(pair.slice(index + 1).trim());
    } catch {
      return pair.slice(index + 1).trim();
    }
  }

  return "";
}

let issuedCsrfToken = "";

export function setCsrfToken(token: string): void {
  issuedCsrfToken = String(token ?? "");
}

export function csrfToken(): string {
  if (issuedCsrfToken) return issuedCsrfToken;
  if (typeof document === "undefined") return "";

  return readCookie(document.cookie, CSRF_COOKIE);
}
