import { Permission } from "./enums";

export const CONTENT_TRANSLATION_PERMISSIONS = {
  news: [Permission.EditorNewsCreate, Permission.EditorNewsUpdate],
  page: [Permission.AdminPagesCreate, Permission.AdminPagesUpdate],
  email_message: [Permission.AdminEmailUpdate],
  server: [Permission.AdminServersCreate, Permission.AdminServersUpdate],
  mod: [Permission.EditorModsCreate, Permission.EditorModsUpdate],
  category: [
    Permission.EditorStoreCategoryCreate,
    Permission.EditorStoreCategoryUpdate,
  ],
  product: [
    Permission.EditorStoreProductsCreate,
    Permission.EditorStoreProductsUpdate,
  ],
  kit: [Permission.EditorStoreKitsCreate, Permission.EditorStoreKitsUpdate],
  donate_group: [
    Permission.EditorDonateGroupsCreate,
    Permission.EditorDonateGroupsUpdate,
  ],
  donate_permission: [
    Permission.EditorDonatePermsCreate,
    Permission.EditorDonatePermsUpdate,
  ],
  group_kit: [
    Permission.EditorDonateKitsCreate,
    Permission.EditorDonateKitsUpdate,
  ],
  period: [
    Permission.EditorDonatePeriodsCreate,
    Permission.EditorDonatePeriodsUpdate,
  ],
} as const;

export type ContentTranslationEntity =
  keyof typeof CONTENT_TRANSLATION_PERMISSIONS;

export function contentTranslationPermissions(entity: string): Permission[] {
  return (
    (CONTENT_TRANSLATION_PERMISSIONS as Record<string, readonly Permission[]>)[
      entity
    ]?.slice() ?? []
  );
}
