export function isBanActive(ban?: { expires?: Date } | null): boolean {
  if (!ban) return false;
  if (!ban.expires) return true;

  return new Date(ban.expires).getTime() > Date.now();
}
