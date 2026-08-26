import { PLAYER_PERMISSION_PREFIX } from "../permissions/catalog";
import { isPlayerPermission } from "../permissions/resolve";

export { IS_PLAYER_PERM } from "../constants";
export { PLAYER_PERMISSION_PREFIX };

export function isPlayerPerm(value: unknown): boolean {
  return isPlayerPermission(value);
}
