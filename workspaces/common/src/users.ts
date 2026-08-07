import { Permission } from "./enums";

export const USER_FIELD_PERMISSIONS = {
  email: Permission.AdminUsersUpdateEmail,
  activated: Permission.AdminUsersUpdateActivation,
  roles: Permission.AdminUsersUpdateRoles,
  perms: Permission.AdminUsersUpdateRoles,
} as const;

export type UserField = keyof typeof USER_FIELD_PERMISSIONS;

export const USER_FIELDS = Object.keys(USER_FIELD_PERMISSIONS) as UserField[];
