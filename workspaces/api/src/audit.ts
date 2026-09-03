export type ModuleAuditClass = 'access' | 'finance' | 'admin' | 'content'

export type ModuleAuditStatus = 'success' | 'failure'

export type ModuleAuditActorType = 'user' | 'system' | 'integration' | 'payment' | 'module'

export interface ModuleAuditAction {
  key: string
  class: ModuleAuditClass
  danger?: boolean
}

export interface ModuleAuditActor {
  type: ModuleAuditActorType
  id?: string | null
  name?: string | null
}

export interface ModuleAuditTarget {
  type: string
  id?: string | null
  name?: string | null
}

export interface ModuleAuditEntry {
  action: string
  status?: ModuleAuditStatus
  actor?: ModuleAuditActor | null
  target?: ModuleAuditTarget | null
  ip?: string | null
  client?: string | null
  changes?: Record<string, [unknown, unknown]> | null
  meta?: Record<string, unknown> | null
  immediate?: boolean
}

export interface AuditSink {
  record(entry: ModuleAuditEntry): void
}

export const moduleAuditActionKey = (id: string, action: ModuleAuditAction): string => `mod.${id}.${action.key}`
