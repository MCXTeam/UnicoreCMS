import { PLAYER_PERMISSION_PREFIX } from "./catalog";
import {
  isDangerPermission,
  permissionMeta,
  permissionUniverse,
  scopedPermissions,
} from "./registry";

export const PERMISSION_WILDCARD = "*";

export const PERMISSION_WILDCARD_SUFFIX = ".*";

export const PERMISSION_DENY_PREFIX = "!";

const REGEXP_ESCAPE = /[.+?^${}()|[\]\\]/g;

function permissionRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(REGEXP_ESCAPE, "\\$&")
    .replace(/\*+/g, ".*");

  return new RegExp(`^${escaped}$`);
}

export function permissionMatches(permission: string, pattern: string): boolean {
  if (permission === pattern) return true;
  if (!pattern.includes(PERMISSION_WILDCARD)) return false;

  return permissionRegExp(pattern).test(permission);
}

export function expandPermissionPattern(pattern: string): string[] {
  if (!pattern.endsWith(PERMISSION_WILDCARD_SUFFIX)) return [pattern];

  const exact = pattern.slice(0, -PERMISSION_WILDCARD_SUFFIX.length);

  return exact ? [pattern, exact] : [pattern];
}

export function isDenyPattern(pattern: string): boolean {
  return pattern.charAt(0) === PERMISSION_DENY_PREFIX;
}

export function denyTarget(pattern: string): string {
  return isDenyPattern(pattern) ? pattern.slice(1) : pattern;
}

export function isPlayerPermission(value: unknown): boolean {
  return (
    typeof value === "string" &&
    denyTarget(value).startsWith(PLAYER_PERMISSION_PREFIX)
  );
}

export function isPanelPermission(value: unknown): boolean {
  return typeof value === "string" && !isPlayerPermission(value);
}

export function filterPlayerPermissions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values.filter(isPlayerPermission);
}

export function filterPanelPermissions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values.filter(isPanelPermission);
}

export function longestScope(
  permission: string,
  scoped: Iterable<string>,
): string | null {
  let base: string | null = null;

  for (const key of scoped)
    if (
      permission.startsWith(`${key}.`) &&
      (!base || key.length > base.length)
    )
      base = key;

  return base;
}

export function scopeOf(permission: string): string | null {
  if (permissionMeta(permission)) return null;

  return longestScope(permission, scopedPermissions());
}

export function isScopedPermission(permission: string): boolean {
  return Boolean(permissionMeta(permission)?.scope);
}

function requiredVariants(required: string): string[] {
  const base = scopeOf(required);

  return base ? [required, base] : [required];
}

export function anyScope(permission: string): string {
  return isScopedPermission(permission) ? `${permission}${PERMISSION_WILDCARD_SUFFIX}` : permission;
}

export function matchPermissions(
  universe: string[],
  pattern: string,
  allowDanger = false,
): string[] {
  const variants = expandPermissionPattern(pattern);
  const wildcard = pattern.includes(PERMISSION_WILDCARD);

  return universe.filter((permission) => {
    if (wildcard && !allowDanger && isDangerPermission(permission))
      return variants.includes(permission);

    return variants.some((variant) => permissionMatches(permission, variant));
  });
}

export function resolvePermissions(
  patterns: string[],
  universe: string[] = permissionUniverse(),
): string[] {
  const allow = new Set<string>();
  const deny = new Set<string>();

  for (const pattern of patterns) {
    const negative = isDenyPattern(pattern);
    const matched = matchPermissions(
      universe,
      denyTarget(pattern),
      negative,
    );

    for (const permission of matched) {
      if (negative) deny.add(permission);
      else allow.add(permission);
    }
  }

  for (const pattern of patterns) {
    if (isDenyPattern(pattern) || pattern.includes(PERMISSION_WILDCARD)) continue;
    if (!scopeOf(pattern)) continue;

    allow.add(pattern);
  }

  return Array.from(allow).filter((permission) => {
    if (deny.has(permission)) return false;

    const base = scopeOf(permission);

    return !base || !deny.has(base);
  });
}

export function coveredPermissions(
  patterns: string[],
  universe: string[] = permissionUniverse(),
): string[] {
  const explicit = new Set(patterns);

  return resolvePermissions(patterns, universe).filter(
    (permission) => !explicit.has(permission),
  );
}

export function satisfiesPermission(
  granted: string[],
  required: string,
): boolean {
  const allow = granted.filter((pattern) => !isDenyPattern(pattern));
  const deny = granted.filter(isDenyPattern).map(denyTarget);

  const matched = (patterns: string[], permission: string, allowDanger: boolean): boolean =>
    patterns.some((pattern) => {
      if (!allowDanger && pattern.includes(PERMISSION_WILDCARD) && isDangerPermission(permission)) return false;

      return expandPermissionPattern(pattern).some((variant) =>
        permissionMatches(permission, variant),
      );
    });

  const variants = requiredVariants(required);

  if (variants.some((variant) => matched(deny, variant, true))) return false;
  if (variants.some((variant) => matched(allow, variant, false))) return true;

  if (!required.includes(PERMISSION_WILDCARD)) return false;

  return allow.some(
    (pattern) =>
      permissionMatches(pattern, required) &&
      !deny.some((blocked) => permissionMatches(pattern, blocked)),
  );
}

export function satisfiesPermissions(
  granted: string[],
  required: string[],
  any = false,
): boolean {
  if (!required.length) return true;

  const satisfied = required.filter((permission) =>
    satisfiesPermission(granted, permission),
  );

  return any ? satisfied.length > 0 : satisfied.length === required.length;
}
