export interface CoreHookMap {
  'payment.referal': { paymentId: number; uuid: string; inviterUuid: string; paid: number; percent: number; amount: number }
  'referal.rewards': { inviterUuid: string }
}

export type CoreHookName = keyof CoreHookMap

export type HookHandler<T> = (payload: T) => boolean | Promise<boolean>

export type HookErrorReporter = (hook: string, owner: string | undefined, error: unknown) => void

interface Subscription {
  handler: HookHandler<any>
  owner?: string
}

export class HookBus {
  private subscriptions = new Map<string, Set<Subscription>>()
  private reporter: HookErrorReporter = () => undefined

  setErrorReporter(reporter: HookErrorReporter): void {
    this.reporter = reporter
  }

  on<K extends CoreHookName>(hook: K, handler: HookHandler<CoreHookMap[K]>, owner?: string): () => void
  on(hook: string, handler: HookHandler<any>, owner?: string): () => void
  on(hook: string, handler: HookHandler<any>, owner?: string): () => void {
    const list = this.subscriptions.get(hook) || new Set<Subscription>()
    const subscription: Subscription = { handler, owner }

    list.add(subscription)
    this.subscriptions.set(hook, list)

    return () => list.delete(subscription)
  }

  offOwner(owner: string): void {
    for (const list of this.subscriptions.values())
      for (const subscription of list) if (subscription.owner === owner) list.delete(subscription)
  }

  async allowed<K extends CoreHookName>(hook: K, payload: CoreHookMap[K]): Promise<boolean>
  async allowed(hook: string, payload: unknown): Promise<boolean>
  async allowed(hook: string, payload: unknown): Promise<boolean> {
    const list = this.subscriptions.get(hook)
    if (!list || !list.size) return true

    for (const subscription of [...list]) {
      try {
        if ((await subscription.handler(payload)) === false) return false
      } catch (error) {
        this.reporter(hook, subscription.owner, error)
      }
    }

    return true
  }

  listeners(hook: string): number {
    return this.subscriptions.get(hook)?.size || 0
  }
}
