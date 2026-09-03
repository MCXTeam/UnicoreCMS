export const AUDIT_CLASSES = ["access", "finance", "admin", "content"] as const;

export type AuditClass = (typeof AUDIT_CLASSES)[number];

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
  class: AuditClass;
  danger?: boolean;
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
  "auth.password.reset.request": { class: "access" },
  "auth.password.reset.confirm": { class: "access" },
  "auth.token.reuse": { class: "access", danger: true },
  "auth.session.revoke": { class: "access" },
  "auth.session.revoke.other": { class: "access" },
  "auth.session.revoke.all": { class: "access" },
  "auth.twofactor.enable": { class: "access" },
  "auth.twofactor.disable": { class: "access" },
  "auth.twofactor.reset": { class: "access", danger: true },
});

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const AUDIT_ACTION_KEYS = Object.keys(AUDIT_ACTIONS) as AuditAction[];

export interface AuditActionEntry extends AuditActionMeta {
  key: string;
}

const extra = new Map<string, AuditActionMeta>();

let cache: AuditActionEntry[] | null = null;

export function registerAuditActions(
  entries: Record<string, AuditActionMeta>,
): void {
  for (const [key, meta] of Object.entries(entries)) extra.set(key, meta);

  cache = null;
}

export function unregisterAuditActions(keys: string[]): void {
  for (const key of keys) extra.delete(key);

  cache = null;
}

export function resetAuditActionRegistry(): void {
  extra.clear();
  cache = null;
}

export function auditActions(): AuditActionEntry[] {
  if (cache) return cache;

  const merged = new Map<string, AuditActionMeta>(
    Object.entries(AUDIT_ACTIONS) as [string, AuditActionMeta][],
  );

  for (const [key, meta] of extra) merged.set(key, meta);

  cache = Array.from(merged, ([key, meta]) => ({ key, ...meta })).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  return cache;
}

export function auditActionMeta(action: string): AuditActionMeta | null {
  return (
    extra.get(action) ??
    (AUDIT_ACTIONS as Record<string, AuditActionMeta>)[action] ??
    null
  );
}

export function auditActionClass(action: string): AuditClass | null {
  return auditActionMeta(action)?.class ?? null;
}

export const AUDIT_LOCALE_PREFIX = "audit.";

export const auditActionKey = (action: string): string =>
  `${AUDIT_LOCALE_PREFIX}action.${action}`;

export const auditClassKey = (value: string): string =>
  `${AUDIT_LOCALE_PREFIX}class.${value}`;

export const auditActorTypeKey = (value: string): string =>
  `${AUDIT_LOCALE_PREFIX}actor.${value}`;

export const AUDIT_PERMISSION_PREFIX = "panel.logs.";

export const auditClassPermission = (value: string): string =>
  `${AUDIT_PERMISSION_PREFIX}${value}.read`;
