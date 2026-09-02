import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PermissionKey,
  PermissionMeta,
} from "./catalog";

export interface PermissionEntry extends PermissionMeta {
  key: string;
}

const extra = new Map<string, PermissionMeta>();

let cache: PermissionEntry[] | null = null;

let revision = 0;

export const permissionRevision = (): number => revision;

export function registerPermissions(
  entries: Record<string, PermissionMeta>,
): void {
  for (const [key, meta] of Object.entries(entries)) extra.set(key, meta);

  cache = null;
  revision += 1;
}

export function unregisterPermissions(keys: string[]): void {
  for (const key of keys) extra.delete(key);

  cache = null;
  revision += 1;
}

export function resetPermissionRegistry(): void {
  extra.clear();
  cache = null;
  revision += 1;
}

export function permissionEntries(): PermissionEntry[] {
  if (!cache)
    cache = [
      ...Object.entries(PERMISSIONS).map(([key, meta]) => ({ key, ...meta })),
      ...Array.from(extra, ([key, meta]) => ({ key, ...meta })),
    ];

  return cache;
}

export function permissionUniverse(): string[] {
  return permissionEntries().map((entry) => entry.key);
}

export function permissionMeta(key: string): PermissionMeta | undefined {
  return extra.get(key) ?? PERMISSIONS[key as PermissionKey];
}

export function isDangerPermission(key: string): boolean {
  return Boolean(permissionMeta(key)?.danger);
}

export function scopedPermissions(): string[] {
  return permissionEntries()
    .filter((entry) => entry.scope)
    .map((entry) => entry.key);
}

export function permissionGroups(): string[] {
  const order = PERMISSION_GROUPS as readonly string[];
  const groups = Array.from(
    new Set(permissionEntries().map((entry) => entry.group)),
  );

  return groups.sort((left, right) => {
    const first = order.indexOf(left);
    const second = order.indexOf(right);

    if (first === -1 && second === -1) return left.localeCompare(right);
    if (first === -1) return 1;
    if (second === -1) return -1;

    return first - second;
  });
}

export function groupPermissions(group: string): PermissionEntry[] {
  return permissionEntries().filter((entry) => entry.group === group);
}
