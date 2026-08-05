import { DONATE_WEB_PERM_PREFIXES } from "../constants";

export { IS_DONATE_WEB_PERM, DONATE_WEB_PERM_PREFIXES } from "../constants";

export function isDonateWebPerm(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const perm = value.charAt(0) === "!" ? value.slice(1) : value;

  return DONATE_WEB_PERM_PREFIXES.some((prefix) => perm.startsWith(prefix));
}

export function filterDonateWebPerms(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values.filter(isDonateWebPerm);
}
