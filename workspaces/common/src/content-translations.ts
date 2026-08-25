import { Permission } from "./enums";

export interface ContentTranslationAccess {
  read: Permission[];
  write: Permission[];
}

export const CONTENT_TRANSLATION_PERMISSIONS: Record<string, ContentTranslationAccess> = {
  news: {
    read: [Permission.EditorNewsCreate, Permission.EditorNewsUpdate],
    write: [Permission.EditorNewsCreate, Permission.EditorNewsUpdate],
  },
  page: {
    read: [Permission.AdminPagesRead, Permission.AdminPagesCreate, Permission.AdminPagesUpdate],
    write: [Permission.AdminPagesCreate, Permission.AdminPagesUpdate],
  },
  email_message: {
    read: [Permission.AdminEmailRead, Permission.AdminEmailUpdate],
    write: [Permission.AdminEmailUpdate],
  },
  server: {
    read: [Permission.AdminServersRead, Permission.AdminServersCreate, Permission.AdminServersUpdate],
    write: [Permission.AdminServersCreate, Permission.AdminServersUpdate],
  },
  mod: {
    read: [Permission.EditorModsCreate, Permission.EditorModsUpdate],
    write: [Permission.EditorModsCreate, Permission.EditorModsUpdate],
  },
  category: {
    read: [Permission.EditorStoreRead, Permission.EditorStoreCategoryCreate, Permission.EditorStoreCategoryUpdate],
    write: [Permission.EditorStoreCategoryCreate, Permission.EditorStoreCategoryUpdate],
  },
  product: {
    read: [Permission.EditorStoreRead, Permission.EditorStoreProductsCreate, Permission.EditorStoreProductsUpdate],
    write: [Permission.EditorStoreProductsCreate, Permission.EditorStoreProductsUpdate],
  },
  kit: {
    read: [Permission.EditorStoreRead, Permission.EditorStoreKitsCreate, Permission.EditorStoreKitsUpdate],
    write: [Permission.EditorStoreKitsCreate, Permission.EditorStoreKitsUpdate],
  },
  donate_group: {
    read: [Permission.EditorDonateRead, Permission.EditorDonateGroupsCreate, Permission.EditorDonateGroupsUpdate],
    write: [Permission.EditorDonateGroupsCreate, Permission.EditorDonateGroupsUpdate],
  },
  donate_permission: {
    read: [Permission.EditorDonateRead, Permission.EditorDonatePermsCreate, Permission.EditorDonatePermsUpdate],
    write: [Permission.EditorDonatePermsCreate, Permission.EditorDonatePermsUpdate],
  },
  group_kit: {
    read: [Permission.EditorDonateRead, Permission.EditorDonateKitsCreate, Permission.EditorDonateKitsUpdate],
    write: [Permission.EditorDonateKitsCreate, Permission.EditorDonateKitsUpdate],
  },
  period: {
    read: [Permission.EditorDonateRead, Permission.EditorDonatePeriodsCreate, Permission.EditorDonatePeriodsUpdate],
    write: [Permission.EditorDonatePeriodsCreate, Permission.EditorDonatePeriodsUpdate],
  },
};

export type ContentTranslationEntity = keyof typeof CONTENT_TRANSLATION_PERMISSIONS;

export function contentTranslationPermissions(entity: string, mode: keyof ContentTranslationAccess): Permission[] {
  return CONTENT_TRANSLATION_PERMISSIONS[entity]?.[mode]?.slice() ?? [];
}
