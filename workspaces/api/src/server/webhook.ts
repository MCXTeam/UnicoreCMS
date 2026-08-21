export interface WebhookPost {
  title: string
  description: string
  image?: string | null
  url?: string
}

export interface WebhookDeliveryResult {
  messageId?: string
  code?: number
  warning?: string
}

export interface WebhookChannel {
  readonly request: string
  publish(target: { url?: string; target?: string }, post: WebhookPost): Promise<WebhookDeliveryResult>
  edit?(target: { url?: string; target?: string }, messageId: string, post: WebhookPost): Promise<WebhookDeliveryResult>
  remove?(target: { url?: string; target?: string }, messageId: string): Promise<void>
}
