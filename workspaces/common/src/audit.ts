import { sharedState } from "./shared-state";

export const AUDIT_CLASSES = ["access", "finance", "admin", "content"] as const;

export type AuditClass = (typeof AUDIT_CLASSES)[number];

export type AuditClassName = AuditClass | (string & {});

export interface AuditClassMeta {
  labelKey: string;
  permission: string;
}

interface AuditState {
  actions: Map<string, AuditActionMeta>;
  classes: Map<string, AuditClassMeta>;
  cache: AuditActionEntry[] | null;
}

const state = sharedState<AuditState>("unicore.audit.registry.v1", () => ({
  actions: new Map<string, AuditActionMeta>(),
  classes: new Map<string, AuditClassMeta>(),
  cache: null,
}));

export function registerAuditClasses(
  entries: Record<string, AuditClassMeta>,
): void {
  for (const [key, meta] of Object.entries(entries)) state.classes.set(key, meta);
}

export function unregisterAuditClasses(keys: string[]): void {
  for (const key of keys) state.classes.delete(key);
}

export function resetAuditClassRegistry(): void {
  state.classes.clear();
}

export function auditClasses(): AuditClassName[] {
  return [...AUDIT_CLASSES, ...state.classes.keys()];
}

export function auditClassMeta(value: string): AuditClassMeta | null {
  return state.classes.get(value) ?? null;
}

export const AUDIT_ACTOR_TYPES = [
  "user",
  "system",
  "integration",
  "payment",
  "module",
] as const;

export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const AUDIT_STATUSES = ["success", "failure"] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export interface AuditActionMeta {
  class: AuditClassName;
  danger?: boolean;
  labelKey?: string;
}

export type AuditChanges = Record<string, [unknown, unknown]>;

function comparable(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return [...value].map(comparable).sort().join(",");
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

export function auditChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  fields?: string[],
): AuditChanges | null {
  const changes: AuditChanges = {};
  const compared =
    fields ?? Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));

  for (const field of compared) {
    const from = before?.[field];
    const to = after?.[field];

    if (comparable(from) === comparable(to)) continue;

    changes[field] = [from ?? null, to ?? null];
  }

  return Object.keys(changes).length ? changes : null;
}

const define = <T extends Record<string, AuditActionMeta>>(catalog: T): T =>
  catalog;

export const AUDIT_ACTIONS = define({
  "auth.login": { class: "access" },
  "auth.login.launcher": { class: "access" },
  "auth.logout": { class: "access" },
  "auth.register": { class: "access" },
  "auth.activate": { class: "access" },
  "auth.password.change": { class: "access" },
  "auth.email.request": { class: "access" },
  "auth.email.change": { class: "access" },
  "auth.password.reset.request": { class: "access" },
  "auth.password.reset.confirm": { class: "access" },
  "auth.token.reuse": { class: "access", danger: true },
  "auth.session.revoke": { class: "access" },
  "auth.session.revoke.other": { class: "access" },
  "auth.session.revoke.all": { class: "access" },
  "auth.twofactor.enable": { class: "access" },
  "auth.twofactor.disable": { class: "access" },
  "auth.twofactor.reset": { class: "access", danger: true },

  "money.balance.adjust": { class: "finance", danger: true },
  "money.transfer": { class: "finance" },
  "money.exchange": { class: "finance" },
  "money.deposit": { class: "finance" },
  "money.withdraw": { class: "finance" },
  "money.real.deposit": { class: "finance", danger: true },
  "money.real.withdraw": { class: "finance", danger: true },
  "money.pay": { class: "finance" },
  "payment.created": { class: "finance" },
  "payment.manual": { class: "finance" },
  "payment.paid": { class: "finance" },
  "payment.referal": { class: "finance" },
  "store.purchase": { class: "finance" },
  "donate.group.grant": { class: "finance" },
  "donate.group.revoke": { class: "finance" },
  "donate.permission.grant": { class: "finance" },
  "donate.permission.revoke": { class: "finance" },
  "gift.send": { class: "finance" },
  "gift.activate": { class: "finance" },
  "gift.create": { class: "finance", danger: true },
  "gift.delete": { class: "finance" },
  "unban.purchase": { class: "finance" },

  "user.create": { class: "admin" },
  "user.update": { class: "admin" },
  "user.delete": { class: "admin", danger: true },
  "user.delete.many": { class: "admin", danger: true },
  "role.create": { class: "admin", danger: true },
  "role.update": { class: "admin", danger: true },
  "role.delete": { class: "admin", danger: true },
  "config.update": { class: "admin" },
  "config.create": { class: "admin" },
  "config.delete": { class: "admin" },
  "apikey.create": { class: "admin", danger: true },
  "apikey.update": { class: "admin", danger: true },
  "apikey.delete": { class: "admin" },
  "webhook.create": { class: "admin" },
  "webhook.update": { class: "admin" },
  "webhook.delete": { class: "admin" },
  "module.install": { class: "admin", danger: true },
  "module.enable": { class: "admin" },
  "module.disable": { class: "admin" },
  "module.remove": { class: "admin", danger: true },
  "theme.rebuild": { class: "admin" },
  "rcon.command": { class: "admin", danger: true },
  "ban.create": { class: "admin" },
  "ban.remove": { class: "admin" },

  "content.create": { class: "content" },
  "content.update": { class: "content" },
  "content.delete": { class: "content" },
});

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const AUDIT_ACTION_KEYS = Object.keys(AUDIT_ACTIONS) as AuditAction[];

export interface AuditActionEntry extends AuditActionMeta {
  key: string;
}

export function registerAuditActions(
  entries: Record<string, AuditActionMeta>,
): void {
  for (const [key, meta] of Object.entries(entries)) state.actions.set(key, meta);

  state.cache = null;
}

export function unregisterAuditActions(keys: string[]): void {
  for (const key of keys) state.actions.delete(key);

  state.cache = null;
}

export function resetAuditActionRegistry(): void {
  state.actions.clear();
  state.cache = null;
}

export function auditActions(): AuditActionEntry[] {
  if (state.cache) return state.cache;

  const merged = new Map<string, AuditActionMeta>(
    Object.entries(AUDIT_ACTIONS) as [string, AuditActionMeta][],
  );

  for (const [key, meta] of state.actions) merged.set(key, meta);

  state.cache = Array.from(merged, ([key, meta]) => ({ key, ...meta })).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  return state.cache;
}

export function auditActionMeta(action: string): AuditActionMeta | null {
  return (
    state.actions.get(action) ??
    (AUDIT_ACTIONS as Record<string, AuditActionMeta>)[action] ??
    null
  );
}

export function auditActionClass(action: string): AuditClassName | null {
  return auditActionMeta(action)?.class ?? null;
}

export const AUDIT_LOCALE_PREFIX = "audit.";

export const auditActionKey = (action: string): string =>
  auditActionMeta(action)?.labelKey ?? `${AUDIT_LOCALE_PREFIX}action.${action}`;

export const auditClassKey = (value: string): string =>
  auditClassMeta(value)?.labelKey ?? `${AUDIT_LOCALE_PREFIX}class.${value}`;

export const auditActorTypeKey = (value: string): string =>
  `${AUDIT_LOCALE_PREFIX}actor.${value}`;

export const AUDIT_PERMISSION_PREFIX = "panel.logs.";

export const auditClassPermission = (value: string): string =>
  auditClassMeta(value)?.permission ?? `${AUDIT_PERMISSION_PREFIX}${value}.read`;
