export function configNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const value = Number(config[key]);

  if (!Number.isFinite(value) || value < min || value > max) return fallback;

  return value;
}
