import type { DataSource } from 'typeorm'
import type { WebhookPost } from './webhook'

export interface UserRecord {
  uuid: string
  username: string
  email: string
  activated: boolean
  superuser: boolean
  perms: string[]
}

export interface IssuanceTarget {
  uuid?: string
  username?: string
  email?: string
}

export interface IssuanceServerRef {
  id: string | number
  name?: string
}

export interface IssuanceProductRef {
  id?: number
  name?: string
  item_id?: string
  nbt?: string
  give_method?: string
  commands?: string[] | null
}

export interface IssuanceGroupRef {
  ingame_id?: string
  name?: string
}

export interface IssuancePermissionRef {
  name?: string
  perms?: string[]
}

export interface UsersApi {
  getById(uuid: string): Promise<UserRecord | null>
  getByUsername(username: string): Promise<UserRecord | null>
  getByEmail(email: string): Promise<UserRecord | null>
  perms(uuid: string): Promise<string[]>
}

export interface ConfigApi {
  get(key: string): Promise<string | null>
  getNumber(key: string, fallback?: number): Promise<number>
  getBoolean(key: string, fallback?: boolean): Promise<boolean>
  set(key: string, value: string | number | boolean): Promise<void>
}

export interface LocalesApi {
  defaultCode(): Promise<string>
  enabled(): Promise<string[]>
  messages(code: string): Promise<Record<string, string>>
}

export interface IssuanceApi {
  isRcon(server: IssuanceServerRef): Promise<boolean>
  deliverProduct(user: IssuanceTarget, server: IssuanceServerRef, product: IssuanceProductRef, amount: number): Promise<boolean>
  deliverGroup(user: IssuanceTarget, server: IssuanceServerRef, group: IssuanceGroupRef, seconds?: number): Promise<boolean>
  removeGroup(user: IssuanceTarget, server: IssuanceServerRef, group: IssuanceGroupRef): Promise<boolean>
  deliverPermission(user: IssuanceTarget, server: IssuanceServerRef, permission: IssuancePermissionRef, seconds?: number): Promise<boolean>
  removePermission(user: IssuanceTarget, server: IssuanceServerRef, permission: IssuancePermissionRef): Promise<boolean>
  runCommands(serverId: string | number, commands: string[]): Promise<void>
}

export interface ServerRecord {
  id: string
  name: string
  icon?: string | null
  version?: string
}

export interface ServerOnline {
  id: string
  online: boolean
  players: number
  maxplayers: number
}

export interface ServersApi {
  all(): Promise<ServerRecord[]>
  one(id: string | number): Promise<ServerRecord | null>
  online(): Promise<ServerOnline[]>
}

export interface MoneyApi {
  ingame(uuid: string, serverId: string | number): Promise<number>
  giveIngame(uuid: string, serverId: string | number, amount: number): Promise<void>
  takeIngame(uuid: string, serverId: string | number, amount: number): Promise<void>
  giveReal(uuid: string, amount: number): Promise<void>
  takeReal(uuid: string, amount: number): Promise<void>
}

export interface PaymentsApi {
  methods(): Promise<string[]>
  create(uuid: string, amount: number, method: string, ip?: string): Promise<number>
  complete(paymentId: number, billId?: string, reportedAmount?: number): Promise<boolean>
  credit(uuid: string, amount: number, method: string, ip?: string): Promise<boolean>
}

export interface WebhookTarget {
  id: number
  name: string
  channel: string
}

export interface WebhooksApi {
  channels(): string[]
  targets(channel?: string): Promise<WebhookTarget[]>
  send(channel: string, post: WebhookPost): Promise<number>
}

export interface MailApi {
  send(to: string, subject: string, html: string): Promise<void>
  sendToUser(uuid: string, subject: string, html: string): Promise<void>
}

export interface StorageApi {
  url(filename: string): string
  save(filename: string, content: Buffer): Promise<string>
  remove(filename: string): Promise<void>
}

export interface CacheApi {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
}

export interface LoggerApi {
  log(message: string): void
  warn(message: string): void
  error(message: string, error?: unknown): void
  debug(message: string): void
}

export interface CoreApi {
  version: string
  users: UsersApi
  config: ConfigApi
  locales: LocalesApi
  issuance: IssuanceApi
  servers: ServersApi
  money: MoneyApi
  payments: PaymentsApi
  webhooks: WebhooksApi
  mail: MailApi
  storage: StorageApi
  cache: CacheApi
  db: DataSource
  logger(moduleId: string): LoggerApi
}
