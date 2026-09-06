export function isBanActive(ban?: { expires?: Date } | null): boolean {
  if (!ban) return false;
  if (!ban.expires) return true;

  const expires = new Date(ban.expires).getTime();

  return !Number.isFinite(expires) || expires > Date.now();
}
