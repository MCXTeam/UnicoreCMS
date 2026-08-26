import { PERMISSIONS, PermissionKey } from "./catalog";
import {
  denyTarget,
  isDenyPattern,
  PERMISSION_DENY_PREFIX,
  permissionMatches,
  expandPermissionPattern,
} from "./resolve";

export const LEGACY_PERMISSIONS: Record<string, PermissionKey | null> = {
  "kernel.unicore.provider": "kernel.provider",
  "kernel.unicore.connect": "kernel.connect",

  "admin.dashboard": "panel.access",
  "admin.dashboard.stats.payments": "panel.dashboard.payments",
  "admin.dashboard.stats.purchases": "panel.dashboard.purchases",
  "admin.dashboard.stats.online": "panel.dashboard.online",
  "admin.dashboard.stats.users": "panel.dashboard.users",
  "admin.dashboard.revenue": "panel.revenue.read",
  "admin.dashboard.events": "panel.events.dashboard",
  "admin.user.events": "panel.events.users",

  "admin.users.read": "panel.users.read",
  "admin.users.create": "panel.users.create",
  "admin.users.update": "panel.users.update",
  "admin.users.delete": "panel.users.delete",
  "admin.users.delete.many": "panel.users.delete.many",
  "admin.users.ban": "panel.users.ban",
  "admin.users.update.email": "panel.users.field.email",
  "admin.users.update.password": "panel.users.field.password",
  "admin.users.update.activation": "panel.users.field.activated",
  "admin.users.update.roles": "panel.users.field.roles",
  "admin.users.update.roles.admin": "panel.users.grant.panel",
  "admin.users.money": "panel.users.money",
  "admin.users.money.%server%": null,
  "admin.users.give": "panel.users.give",
  "admin.users.give.%server%": null,
  "admin.users.donate": "panel.users.donate",
  "admin.users.donate.%server%": null,

  "admin.servers.read": "panel.servers.read",
  "admin.servers.create": "panel.servers.create",
  "admin.servers.update": "panel.servers.update",
  "admin.servers.delete": "panel.servers.delete",
  "admin.servers.rcon": "panel.servers.rcon",

  "admin.pages.read": null,
  "admin.pages.create": "panel.pages.create",
  "admin.pages.update": "panel.pages.update",
  "admin.pages.delete": "panel.pages.delete",

  "admin.email.read": "panel.email.read",
  "admin.email.test": "panel.email.test",
  "admin.email.update": "panel.email.update",

  "admin.webhooks.read": "panel.webhooks.read",
  "admin.webhooks.create": "panel.webhooks.create",
  "admin.webhooks.update": "panel.webhooks.update",
  "admin.webhooks.delete": "panel.webhooks.delete",
  "admin.webhooks.delete.many": "panel.webhooks.delete.many",

  "editor.mods.create": "panel.mods.create",
  "editor.mods.update": "panel.mods.update",
  "editor.mods.delete": "panel.mods.delete",
  "editor.mods.delete.many": "panel.mods.delete.many",

  "editor.news.create": "panel.news.create",
  "editor.news.update": "panel.news.update",
  "editor.news.delete": "panel.news.delete",
  "editor.news.delete.many": "panel.news.delete.many",
  "editor.news.publish": "panel.news.publish",
  "editor.news.hidden": "panel.news.hidden",

  "editor.groups.read": "panel.donate.read",

  "editor.donate.groups.create": "panel.donate.groups.create",
  "editor.donate.groups.update": "panel.donate.groups.update",
  "editor.donate.groups.delete": "panel.donate.groups.delete",
  "editor.donate.groups.delete.many": "panel.donate.groups.delete.many",

  "editor.donate.permissions.create": "panel.donate.permissions.create",
  "editor.donate.permissions.update": "panel.donate.permissions.update",
  "editor.donate.permissions.delete": "panel.donate.permissions.delete",
  "editor.donate.permissions.delete.many":
    "panel.donate.permissions.delete.many",

  "editor.donate.kits.create": "panel.donate.kits.create",
  "editor.donate.kits.update": "panel.donate.kits.update",
  "editor.donate.kits.delete": "panel.donate.kits.delete",
  "editor.donate.kits.delete.many": "panel.donate.kits.delete.many",

  "editor.donate.periods.create": "panel.donate.periods.create",
  "editor.donate.periods.update": "panel.donate.periods.update",
  "editor.donate.periods.delete": "panel.donate.periods.delete",

  "editor.store.read": "panel.store.read",

  "editor.store.category.create": "panel.store.categories.create",
  "editor.store.category.update": "panel.store.categories.update",
  "editor.store.category.delete": "panel.store.categories.delete",
  "editor.store.category.delete.many": "panel.store.categories.delete.many",

  "editor.store.products.create": "panel.store.products.create",
  "editor.store.products.update": "panel.store.products.update",
  "editor.store.products.update.many": "panel.store.products.update.many",
  "editor.store.products.delete": "panel.store.products.delete",
  "editor.store.products.delete.many": "panel.store.products.delete.many",
  "editor.store.products.export": "panel.store.products.export",
  "editor.store.products.import": "panel.store.products.import",

  "editor.store.kits.create": "panel.store.kits.create",
  "editor.store.kits.update": "panel.store.kits.update",
  "editor.store.kits.delete": "panel.store.kits.delete",
  "editor.store.kits.delete.many": "panel.store.kits.delete.many",

  "editor.cabinet.gifts.read": "panel.gifts.read",
  "editor.cabinet.gifts.create": "panel.gifts.create",
  "editor.cabinet.gifts.update": "panel.gifts.update",
  "editor.cabinet.gifts.delete": "panel.gifts.delete",
  "editor.cabinet.gifts.delete.many": "panel.gifts.delete.many",

  "editor.cabinet.votesgifts.create": "panel.votes.create",
  "editor.cabinet.votesgifts.update": "panel.votes.update",
  "editor.cabinet.votesgifts.delete": "panel.votes.delete",

  "editor.cabinet.paymentbonuses.create": "panel.payment.bonuses.create",
  "editor.cabinet.paymentbonuses.update": "panel.payment.bonuses.update",
  "editor.cabinet.paymentbonuses.delete": "panel.payment.bonuses.delete",

  "user.cabinet.skin": "player.skin.upload",
  "user.cabinet.skin.hd": "player.skin.hd",
  "user.cabinet.cloak": "player.cloak.upload",
  "user.cabinet.cloak.hd": "player.cloak.hd",
  "user.cabinet.unban.buy": "player.unban.buy",
  "user.donate.group.buy": "player.donate.group.buy",
  "user.donate.permission.buy": "player.donate.permission.buy",
  "user.cabinet.2fa.on": "player.twofactor.on",
  "user.cabinet.2fa.off": "player.twofactor.off",
  "user.cabinet.password.change": "player.password.change",
  "user.payment": "player.payment",
  "user.cabinet.transfer": "player.transfer",
  "user.cabinet.exchange": "player.exchange",
  "user.cabinet.gift.activate": "player.gift.activate",
  "user.cabinet.gift.buy": "player.gift.buy",
};

const LEGACY_SCOPED: Record<string, PermissionKey> = {
  "admin.users.money": "panel.users.money",
  "admin.users.give": "panel.users.give",
  "admin.users.donate": "panel.users.donate",
};

const LEGACY_UNIVERSE = Object.keys(LEGACY_PERMISSIONS);

function scopedTarget(target: string): string | null {
  for (const [legacy, key] of Object.entries(LEGACY_SCOPED)) {
    if (!target.startsWith(`${legacy}.`)) continue;

    const suffix = target.slice(legacy.length + 1);

    if (suffix.includes("*") || suffix === "%server%") return null;

    return `${key}.${suffix}`;
  }

  return null;
}

function readPermissions(key: string): string[] {
  const parts = key.split(".");
  const found: string[] = [];

  for (let index = 2; index < parts.length; index++) {
    const candidate = `${parts.slice(0, index).join(".")}.read`;

    if (candidate in PERMISSIONS) found.push(candidate);
  }

  return found;
}

function mapTarget(target: string): string[] {
  const scoped = scopedTarget(target);

  if (scoped) return [scoped];

  const variants = expandPermissionPattern(target);
  const matched = LEGACY_UNIVERSE.filter((legacy) =>
    variants.some((variant) => permissionMatches(legacy, variant)),
  );

  return matched.map((legacy) => LEGACY_PERMISSIONS[legacy]).filter(Boolean) as string[];
}

export function isLegacyPermission(pattern: string): boolean {
  const target = denyTarget(pattern);

  return (
    target in LEGACY_PERMISSIONS ||
    Boolean(scopedTarget(target)) ||
    mapTarget(target).length > 0
  );
}

export function migratePermissions(patterns: string[]): string[] {
  const allow = new Set<string>();
  const deny = new Set<string>();

  for (const pattern of patterns) {
    if (!pattern) continue;

    const negative = isDenyPattern(pattern);
    const target = denyTarget(pattern);
    const mapped = mapTarget(target);

    if (!mapped.length) {
      if (!isLegacyPermission(target)) (negative ? deny : allow).add(target);

      continue;
    }

    for (const key of mapped) {
      if (negative) {
        deny.add(key);

        continue;
      }

      allow.add(key);

      for (const read of readPermissions(key)) allow.add(read);
    }
  }

  return [
    ...Array.from(allow).filter((key) => !deny.has(key)),
    ...Array.from(deny).map((key) => `${PERMISSION_DENY_PREFIX}${key}`),
  ];
}
