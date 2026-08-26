
import { Permission } from "./permissions/catalog";

export interface ContentTranslationAccess {
  read: Permission[];
  write: Permission[];
}

export const CONTENT_TRANSLATION_PERMISSIONS: Record<string, ContentTranslationAccess> = {
  news: {
    read: ['panel.news.read', 'panel.news.create', 'panel.news.update'],
    write: ['panel.news.create', 'panel.news.update'],
  },
  page: {
    read: ['panel.pages.create', 'panel.pages.update'],
    write: ['panel.pages.create', 'panel.pages.update'],
  },
  email_message: {
    read: ['panel.email.read', 'panel.email.update'],
    write: ['panel.email.update'],
  },
  server: {
    read: ['panel.servers.read', 'panel.servers.create', 'panel.servers.update'],
    write: ['panel.servers.create', 'panel.servers.update'],
  },
  mod: {
    read: ['panel.mods.read', 'panel.mods.create', 'panel.mods.update'],
    write: ['panel.mods.create', 'panel.mods.update'],
  },
  category: {
    read: ['panel.store.read', 'panel.store.categories.create', 'panel.store.categories.update'],
    write: ['panel.store.categories.create', 'panel.store.categories.update'],
  },
  product: {
    read: ['panel.store.read', 'panel.store.products.create', 'panel.store.products.update'],
    write: ['panel.store.products.create', 'panel.store.products.update'],
  },
  kit: {
    read: ['panel.store.read', 'panel.store.kits.create', 'panel.store.kits.update'],
    write: ['panel.store.kits.create', 'panel.store.kits.update'],
  },
  donate_group: {
    read: ['panel.donate.read', 'panel.donate.groups.create', 'panel.donate.groups.update'],
    write: ['panel.donate.groups.create', 'panel.donate.groups.update'],
  },
  donate_permission: {
    read: ['panel.donate.read', 'panel.donate.permissions.create', 'panel.donate.permissions.update'],
    write: ['panel.donate.permissions.create', 'panel.donate.permissions.update'],
  },
  group_kit: {
    read: ['panel.donate.read', 'panel.donate.kits.create', 'panel.donate.kits.update'],
    write: ['panel.donate.kits.create', 'panel.donate.kits.update'],
  },
  period: {
    read: ['panel.donate.read', 'panel.donate.periods.create', 'panel.donate.periods.update'],
    write: ['panel.donate.periods.create', 'panel.donate.periods.update'],
  },
};

export type ContentTranslationEntity = keyof typeof CONTENT_TRANSLATION_PERMISSIONS;

export function contentTranslationPermissions(entity: string, mode: keyof ContentTranslationAccess): Permission[] {
  return CONTENT_TRANSLATION_PERMISSIONS[entity]?.[mode]?.slice() ?? [];
}
