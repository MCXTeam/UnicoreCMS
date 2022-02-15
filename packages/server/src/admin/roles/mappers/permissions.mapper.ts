import { uniq } from "lodash";
import { EventPermission, Permission } from "unicore-common";

export const PermissionMapper = uniq(
  Object.values({ ...Permission, ...EventPermission })
    .map((perm) => {
      const perm_map = perm.split('.').map((part, index, perm_split) => {
        return [perm_split.map((v, i, o) => perm_split.slice(0, -i).join('.') + '.*'), perm_split.join('.')];
      });
      return perm_map;
    })
    .flat(3)
    .sort(),
).filter((perm) => perm !== '.*');