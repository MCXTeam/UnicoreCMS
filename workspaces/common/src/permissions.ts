import {
  DONATE_WEB_PERM_PREFIXES,
  PERMISSION_WILDCARD_SUFFIX,
} from "./constants";

export function expandPermissionPattern(pattern: string): string[] {
  if (!pattern.endsWith(PERMISSION_WILDCARD_SUFFIX)) return [pattern];

  const exact = pattern.slice(0, -PERMISSION_WILDCARD_SUFFIX.length);

  return exact ? [pattern, exact] : [pattern];
}

export function isAdminPermission(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const permission = value.charAt(0) === "!" ? value.slice(1) : value;

  return !DONATE_WEB_PERM_PREFIXES.some((prefix) =>
    permission.startsWith(prefix),
  );
}

export function filterAdminPermissions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values.filter(isAdminPermission);
}

export const SERVER_PERMISSION_PLACEHOLDER = "%server%";

export function anyServerPermission(permission: string): string {
  return permission.replace(SERVER_PERMISSION_PLACEHOLDER, "*");
}
