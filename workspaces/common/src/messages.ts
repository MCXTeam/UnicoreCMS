const LOCALE_KEY_PATTERN = /^error\.[a-z][a-z0-9_]*$/;

export function serverMessage(payload: unknown): string {
  const source = payload as Record<string, any> | null;
  const message = source?.response?.data?.message ?? source?.message ?? source;
  const first = Array.isArray(message) ? message[0] : message;

  return typeof first === "string" ? first : "";
}

export function serverMessageKey(payload: unknown): string | null {
  const message = serverMessage(payload);

  return LOCALE_KEY_PATTERN.test(message) ? message : null;
}
