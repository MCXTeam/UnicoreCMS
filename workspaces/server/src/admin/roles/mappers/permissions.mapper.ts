import { uniq } from 'lodash';
import { EventPermission, Permission } from 'unicore-common';

export const PermissionMapper = uniq(
  [...Object.values(Permission), ...Object.values(EventPermission)]
    .map((perm) => {
      const parts = perm.split('.');
      const wildcards = parts.slice(0, -1).map((_part, index) => parts.slice(0, index + 1).join('.') + '.*');

      return [...wildcards, perm];
    })
    .flat()
    .sort(),
);
