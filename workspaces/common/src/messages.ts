const LOCALE_KEY_PATTERN = /^error\.[a-z][a-z0-9_]*$/;

export type AuthOperation =
  | "login"
  | "totp"
  | "register"
  | "verify"
  | "reset"
  | "password"
  | "resend"
  | "session";

export function responseStatus(error: unknown): number | undefined {
  const source = error as { response?: { status?: unknown } } | null;
  const status = source?.response?.status;

  return typeof status === "number" ? status : undefined;
}

export function authErrorKey(error: unknown, operation: AuthOperation): string {
  const status = responseStatus(error);

  if (status === 429) return "error.too_many_requests";
  if (status !== undefined && status >= 500) return "error.service_unavailable";

  const key = serverMessageKey(error);

  if (key) return key;
  if (status === undefined || status === 0) return "error.request_failed";
  if (operation === "register" && status === 409) return "auth.already_exists";
  if (operation === "login" && status === 401) return "auth.wrong_credentials";
  if (operation === "totp" && status === 401) return "auth.totp_wrong";
  if (operation === "verify" && status === 404) return "auth.code_invalid";
  if (operation === "password" && (status === 404 || status === 410))
    return "auth.reset_link_invalid";
  if (status === 400 || status === 422) return "error.invalid_input";
  if (status === 403) return "error.no_permission";

  return "error.request_failed";
}

export function serverMessage(payload: unknown): string {
  const source = payload as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  } | null;
  const message = source?.response?.data?.message ?? source?.message ?? source;
  const first = Array.isArray(message) ? message[0] : message;

  return typeof first === "string" ? first : "";
}

export function serverMessageKey(payload: unknown): string | null {
  const message = serverMessage(payload);

  return LOCALE_KEY_PATTERN.test(message) ? message : null;
}
