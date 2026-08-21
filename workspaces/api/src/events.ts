export interface CoreEventMap {
  'core.ready': { version: string }
  'core.shutdown': Record<string, never>
  'user.registered': { uuid: string; username: string; email: string }
  'user.activated': { uuid: string; username: string }
  'user.login': { uuid: string; username: string; ip?: string }
  'user.password.changed': { uuid: string; username: string }
  'user.banned': { uuid: string; username: string; reason?: string; until?: Date | null }
  'user.unbanned': { uuid: string; username: string }
  'payment.created': { id: number; uuid: string; amount: number; method: string }
  'payment.paid': { id: number; uuid: string; amount: number; method: string }
  'purchase.completed': { uuid: string; serverId: number; kind: 'product' | 'kit'; itemId: number; amount: number }
  'donate.group.granted': { uuid: string; serverId: number; groupId: number; seconds: number }
  'donate.group.revoked': { uuid: string; serverId: number; groupId: number }
  'donate.permission.granted': { uuid: string; serverId: number; permissionId: number; seconds: number }
  'donate.permission.revoked': { uuid: string; serverId: number; permissionId: number }
  'gift.activated': { uuid: string; promocode: string; type: string }
  'news.published': { id: number; title: string }
}

export type CoreEventName = keyof CoreEventMap

export type EventHandler<T> = (payload: T) => void | Promise<void>

interface Subscription {
  handler: EventHandler<any>
  once: boolean
  owner?: string
}

export type EventErrorReporter = (event: string, owner: string | undefined, error: unknown) => void

export class EventBus {
  private subscriptions = new Map<string, Set<Subscription>>()
  private reporter: EventErrorReporter = () => undefined

  setErrorReporter(reporter: EventErrorReporter): void {
    this.reporter = reporter
  }

  on<K extends CoreEventName>(event: K, handler: EventHandler<CoreEventMap[K]>, owner?: string): () => void
  on(event: string, handler: EventHandler<any>, owner?: string): () => void
  on(event: string, handler: EventHandler<any>, owner?: string): () => void {
    return this.subscribe(event, handler, false, owner)
  }

  once<K extends CoreEventName>(event: K, handler: EventHandler<CoreEventMap[K]>, owner?: string): () => void
  once(event: string, handler: EventHandler<any>, owner?: string): () => void
  once(event: string, handler: EventHandler<any>, owner?: string): () => void {
    return this.subscribe(event, handler, true, owner)
  }

  off(event: string, handler: EventHandler<any>): void {
    const list = this.subscriptions.get(event)
    if (!list) return

    for (const subscription of list) if (subscription.handler === handler) list.delete(subscription)
  }

  offOwner(owner: string): void {
    for (const list of this.subscriptions.values())
      for (const subscription of list) if (subscription.owner === owner) list.delete(subscription)
  }

  async emit<K extends CoreEventName>(event: K, payload: CoreEventMap[K]): Promise<void>
  async emit(event: string, payload: unknown): Promise<void>
  async emit(event: string, payload: unknown): Promise<void> {
    const list = this.subscriptions.get(event)
    if (!list || !list.size) return

    for (const subscription of [...list]) {
      if (subscription.once) list.delete(subscription)

      try {
        await subscription.handler(payload)
      } catch (error) {
        this.reporter(event, subscription.owner, error)
      }
    }
  }

  listeners(event: string): number {
    return this.subscriptions.get(event)?.size || 0
  }

  private subscribe(event: string, handler: EventHandler<any>, once: boolean, owner?: string): () => void {
    const list = this.subscriptions.get(event) || new Set<Subscription>()
    const subscription: Subscription = { handler, once, owner }

    list.add(subscription)
    this.subscriptions.set(event, list)

    return () => list.delete(subscription)
  }
}
