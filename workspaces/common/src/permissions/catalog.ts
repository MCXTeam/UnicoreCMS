export type PermissionScope = "server";

export type PermissionField = [entity: string, ...fields: string[]];

export interface PermissionMeta {
  group: string;
  scope?: PermissionScope;
  danger?: boolean;
  field?: PermissionField;
}

const define = <T extends Record<string, PermissionMeta>>(catalog: T): T =>
  catalog;

export const PERMISSION_GROUPS = [
  "access",
  "dashboard",
  "users",
  "roles",
  "servers",
  "news",
  "pages",
  "mods",
  "donate",
  "store",
  "gifts",
  "votes",
  "payment",
  "email",
  "webhooks",
  "locales",
  "config",
  "extensions",
  "api",
  "events",
  "player",
  "kernel",
] as const;

export const PERMISSIONS = define({
  "panel.access": { group: "access" },

  "panel.dashboard.payments": {
    group: "dashboard",
    field: ["dashboard", "payments"],
  },
  "panel.dashboard.purchases": {
    group: "dashboard",
    field: ["dashboard", "purchases"],
    scope: "server",
  },
  "panel.dashboard.online": {
    group: "dashboard",
    field: ["dashboard", "online_records"],
  },
  "panel.dashboard.users": {
    group: "dashboard",
    field: ["dashboard", "users"],
  },
  "panel.revenue.read": { group: "dashboard", scope: "server" },

  "panel.users.read": { group: "users" },
  "panel.users.create": { group: "users" },
  "panel.users.update": { group: "users" },
  "panel.users.delete": { group: "users" },
  "panel.users.delete.many": { group: "users" },
  "panel.users.ban": { group: "users" },
  "panel.users.field.username": { group: "users", field: ["user", "username"] },
  "panel.users.field.email": { group: "users", field: ["user", "email"] },
  "panel.users.field.password": { group: "users", field: ["user", "password"] },
  "panel.users.field.activated": {
    group: "users",
    field: ["user", "activated"],
  },
  "panel.users.field.roles": {
    group: "users",
    field: ["user", "roles", "perms"],
  },
  "panel.users.field.superuser": {
    group: "users",
    field: ["user", "superuser"],
    danger: true,
  },
  "panel.users.grant.panel": { group: "users", danger: true },
  "panel.users.twofactor.reset": { group: "users", danger: true },
  "panel.users.sessions.revoke": { group: "users" },
  "panel.users.money": { group: "users", scope: "server" },
  "panel.users.give": { group: "users", scope: "server" },
  "panel.users.donate": { group: "users", scope: "server" },

  "panel.roles.read": { group: "roles" },
  "panel.roles.create": { group: "roles", danger: true },
  "panel.roles.update": { group: "roles", danger: true },
  "panel.roles.delete": { group: "roles", danger: true },

  "panel.servers.read": { group: "servers" },
  "panel.servers.create": { group: "servers" },
  "panel.servers.update": { group: "servers", scope: "server" },
  "panel.servers.delete": { group: "servers" },
  "panel.servers.rcon": { group: "servers", scope: "server" },
  "panel.servers.field.rcon": {
    group: "servers",
    field: ["server", "rcon"],
    danger: true,
  },

  "panel.news.read": { group: "news" },
  "panel.news.create": { group: "news" },
  "panel.news.update": { group: "news" },
  "panel.news.delete": { group: "news" },
  "panel.news.delete.many": { group: "news" },
  "panel.news.publish": { group: "news" },
  "panel.news.hidden": { group: "news" },

  "panel.pages.create": { group: "pages" },
  "panel.pages.update": { group: "pages" },
  "panel.pages.delete": { group: "pages" },

  "panel.mods.read": { group: "mods", scope: "server" },
  "panel.mods.create": { group: "mods" },
  "panel.mods.update": { group: "mods", scope: "server" },
  "panel.mods.delete": { group: "mods", scope: "server" },
  "panel.mods.delete.many": { group: "mods", scope: "server" },

  "panel.donate.read": { group: "donate", scope: "server" },
  "panel.donate.groups.create": { group: "donate", scope: "server" },
  "panel.donate.groups.update": { group: "donate", scope: "server" },
  "panel.donate.groups.delete": { group: "donate", scope: "server" },
  "panel.donate.groups.delete.many": { group: "donate", scope: "server" },
  "panel.donate.groups.field.price": {
    group: "donate",
    field: ["donate_group", "price", "sale"],
  },
  "panel.donate.groups.field.perms": {
    group: "donate",
    field: ["donate_group", "web_perms"],
    danger: true,
  },
  "panel.donate.permissions.create": { group: "donate", scope: "server" },
  "panel.donate.permissions.update": { group: "donate", scope: "server" },
  "panel.donate.permissions.delete": { group: "donate", scope: "server" },
  "panel.donate.permissions.delete.many": { group: "donate", scope: "server" },
  "panel.donate.permissions.field.price": {
    group: "donate",
    field: ["donate_permission", "price", "sale"],
  },
  "panel.donate.permissions.field.perms": {
    group: "donate",
    field: ["donate_permission", "perms", "web_perms"],
    danger: true,
  },
  "panel.donate.kits.create": { group: "donate" },
  "panel.donate.kits.update": { group: "donate" },
  "panel.donate.kits.delete": { group: "donate" },
  "panel.donate.kits.delete.many": { group: "donate" },
  "panel.donate.periods.create": { group: "donate" },
  "panel.donate.periods.update": { group: "donate" },
  "panel.donate.periods.delete": { group: "donate" },

  "panel.store.read": { group: "store", scope: "server" },
  "panel.store.categories.create": { group: "store" },
  "panel.store.categories.update": { group: "store" },
  "panel.store.categories.delete": { group: "store" },
  "panel.store.categories.delete.many": { group: "store" },
  "panel.store.products.create": { group: "store", scope: "server" },
  "panel.store.products.update": { group: "store", scope: "server" },
  "panel.store.products.update.many": { group: "store", scope: "server" },
  "panel.store.products.delete": { group: "store", scope: "server" },
  "panel.store.products.delete.many": { group: "store", scope: "server" },
  "panel.store.products.export": { group: "store" },
  "panel.store.products.import": { group: "store", scope: "server" },
  "panel.store.products.field.price": {
    group: "store",
    field: ["store_product", "price", "sale"],
  },
  "panel.store.products.field.commands": {
    group: "store",
    field: ["store_product", "commands"],
    danger: true,
  },
  "panel.store.kits.create": { group: "store", scope: "server" },
  "panel.store.kits.update": { group: "store", scope: "server" },
  "panel.store.kits.delete": { group: "store", scope: "server" },
  "panel.store.kits.delete.many": { group: "store", scope: "server" },

  "panel.gifts.read": { group: "gifts" },
  "panel.gifts.create": { group: "gifts" },
  "panel.gifts.update": { group: "gifts" },
  "panel.gifts.delete": { group: "gifts" },
  "panel.gifts.delete.many": { group: "gifts" },

  "panel.votes.read": { group: "votes" },
  "panel.votes.create": { group: "votes" },
  "panel.votes.update": { group: "votes" },
  "panel.votes.delete": { group: "votes" },

  "panel.payment.bonuses.read": { group: "payment" },
  "panel.payment.bonuses.create": { group: "payment" },
  "panel.payment.bonuses.update": { group: "payment" },
  "panel.payment.bonuses.delete": { group: "payment" },

  "panel.email.read": { group: "email" },
  "panel.email.update": { group: "email" },
  "panel.email.test": { group: "email" },

  "panel.webhooks.read": { group: "webhooks" },
  "panel.webhooks.create": { group: "webhooks" },
  "panel.webhooks.update": { group: "webhooks" },
  "panel.webhooks.delete": { group: "webhooks" },
  "panel.webhooks.delete.many": { group: "webhooks" },

  "panel.locales.read": { group: "locales" },
  "panel.locales.update": { group: "locales" },
  "panel.locales.manage": { group: "locales", danger: true },

  "panel.config.read": { group: "config", danger: true },
  "panel.config.update": { group: "config", danger: true },

  "panel.extensions.read": { group: "extensions" },
  "panel.extensions.manage": { group: "extensions", danger: true },

  "panel.api.read": { group: "api", danger: true },
  "panel.api.manage": { group: "api", danger: true },

  "panel.events.dashboard": { group: "events" },
  "panel.events.users": { group: "events" },

  "player.skin.upload": { group: "player" },
  "player.skin.hd": { group: "player" },
  "player.cloak.upload": { group: "player" },
  "player.cloak.hd": { group: "player" },
  "player.password.change": { group: "player" },
  "player.twofactor.on": { group: "player" },
  "player.twofactor.off": { group: "player" },
  "player.payment": { group: "player" },
  "player.transfer": { group: "player" },
  "player.exchange": { group: "player" },
  "player.unban.buy": { group: "player" },
  "player.donate.group.buy": { group: "player" },
  "player.donate.permission.buy": { group: "player" },
  "player.gift.activate": { group: "player" },
  "player.gift.buy": { group: "player" },

  "kernel.provider": { group: "kernel" },
  "kernel.connect": { group: "kernel" },
});

export type PermissionKey = Extract<keyof typeof PERMISSIONS, string>;

export type Permission = PermissionKey | (string & {});

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export const PLAYER_PERMISSION_PREFIX = "player.";

export const PERMISSION_LOCALE_PREFIX = "perm.";

export const PERMISSION_HINT_SUFFIX = ".hint";

export const permissionLabelKey = (permission: string): string =>
  `${PERMISSION_LOCALE_PREFIX}${permission}`;

export const permissionHintKey = (permission: string): string =>
  `${PERMISSION_LOCALE_PREFIX}${permission}${PERMISSION_HINT_SUFFIX}`;

export const permissionGroupKey = (group: string): string =>
  `${PERMISSION_LOCALE_PREFIX}group.${group}`;
