import { sharedState } from "../shared-state";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PermissionKey,
  PermissionMeta,
} from "./catalog";

export interface PermissionEntry extends PermissionMeta {
  key: string;
}

export interface PermissionCatalogEntry extends PermissionEntry {
  grantable: boolean;
}

interface RegistryState {
  extra: Map<string, PermissionMeta>;
  cache: PermissionEntry[] | null;
  revision: number;
}

const state = sharedState<RegistryState>("unicore.permissions.registry.v1", () => ({
  extra: new Map<string, PermissionMeta>(),
  cache: null,
  revision: 0,
}));

export const permissionRevision = (): number => state.revision;

export function registerPermissions(
  entries: Record<string, PermissionMeta>,
): void {
  for (const [key, meta] of Object.entries(entries)) state.extra.set(key, meta);

  state.cache = null;
  state.revision += 1;
}

export function unregisterPermissions(keys: string[]): void {
  for (const key of keys) state.extra.delete(key);

  state.cache = null;
  state.revision += 1;
}

export function resetPermissionRegistry(): void {
  state.extra.clear();
  state.cache = null;
  state.revision += 1;
}

export function permissionEntries(): PermissionEntry[] {
  if (!state.cache)
    state.cache = [
      ...Object.entries(PERMISSIONS).map(([key, meta]) => ({ key, ...meta })),
      ...Array.from(state.extra, ([key, meta]) => ({ key, ...meta })),
    ];

  return state.cache;
}

export function permissionUniverse(): string[] {
  return permissionEntries().map((entry) => entry.key);
}

export function permissionMeta(key: string): PermissionMeta | undefined {
  return state.extra.get(key) ?? PERMISSIONS[key as PermissionKey];
}

export function isDangerPermission(key: string): boolean {
  return Boolean(permissionMeta(key)?.danger);
}

export function isGrantedPermission(key: string): boolean {
  return Boolean(permissionMeta(key)?.granted);
}

export function defaultGrantedPermissions(): string[] {
  return permissionEntries()
    .filter((entry) => entry.granted)
    .map((entry) => entry.key);
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
