import { Injectable } from '@nestjs/common'
import type { WebhookChannel, WebhookDeliveryResult, WebhookPost } from 'unicore-api/server'
import { core } from 'unicore-api/server'

@Injectable()
export class DemoChannel implements WebhookChannel {
  readonly request = 'demo'

  async publish(target: { url?: string }, post: WebhookPost): Promise<WebhookDeliveryResult> {
    core().logger('demo').log(`Канал demo получил пост «${post.title}» для ${target.url || 'без адреса'}`)

    return { messageId: `demo-${Date.now()}` }
  }
}
