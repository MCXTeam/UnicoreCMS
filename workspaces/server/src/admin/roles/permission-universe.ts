import { uniq } from 'lodash';
import { EventPermission, Permission } from 'unicore-common';
import { modulePermissions } from 'src/modules/runtime';

let cache: string[] | null = null;

export const permissionUniverse = (): string[] => {
  if (!cache) cache = uniq([...Object.values(Permission), ...Object.values(EventPermission), ...modulePermissions()]);

  return cache;
};

export const resetPermissionUniverse = (): void => {
  cache = null;
};
