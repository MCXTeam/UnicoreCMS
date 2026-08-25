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

const PERMISSION_REGEXP_ESCAPE = /[.+?^${}()|[\]\\]/g;

function permissionRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(PERMISSION_REGEXP_ESCAPE, "\\$&")
    .replace(/\*+/g, ".*");

  return new RegExp(`^${escaped}$`);
}

export function permissionMatches(permission: string, pattern: string): boolean {
  if (permission === pattern) return true;
  if (!pattern.includes("*")) return false;

  return permissionRegExp(pattern).test(permission);
}

export function matchPermissions(universe: string[], pattern: string): string[] {
  const variants = expandPermissionPattern(pattern);

  return universe.filter((permission) =>
    variants.some((variant) => permissionMatches(permission, variant)),
  );
}

export function resolvePermissions(
  patterns: string[],
  universe: string[],
): string[] {
  const allow = new Set<string>();
  const deny = new Set<string>();

  for (const pattern of patterns) {
    const negative = pattern.charAt(0) === "!";
    const matched = matchPermissions(
      universe,
      negative ? pattern.slice(1) : pattern,
    );

    for (const permission of matched) {
      if (negative) deny.add(permission);
      else allow.add(permission);
    }
  }

  return Array.from(allow).filter((permission) => !deny.has(permission));
}

export function coveredPermissions(
  patterns: string[],
  universe: string[],
): string[] {
  const explicit = new Set(patterns);

  return resolvePermissions(patterns, universe).filter(
    (permission) => !explicit.has(permission),
  );
}
