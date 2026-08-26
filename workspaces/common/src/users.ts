import { fieldPermissions } from "./permissions/fields";

export const USER_FIELD_PERMISSIONS = fieldPermissions("user");

export type UserField =
  | "username"
  | "email"
  | "password"
  | "activated"
  | "roles"
  | "perms"
  | "superuser";

export const USER_FIELDS = Object.keys(USER_FIELD_PERMISSIONS) as UserField[];
