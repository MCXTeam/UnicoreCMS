import { WebhookRequestType } from '../enums/webhook-request-type';
import { WebhookType } from '../enums/webhook-type.enum';

export const WebhookMapper = [
  {
    id: WebhookType.NewsCreated,
    description: 'admin.webhook_event_news_created',
    supports: [WebhookRequestType.Discord, WebhookRequestType.Telegram, WebhookRequestType.VK, WebhookRequestType.JSON],
  },

  {
    id: WebhookType.VKNewsCreated,
    description: 'admin.webhook_event_vknews_created',
    supports: [WebhookRequestType.Discord, WebhookRequestType.JSON],
  },
];

export const WEBHOOK_URL_REQUESTS = [WebhookRequestType.Discord, WebhookRequestType.JSON];
export const WEBHOOK_TARGET_REQUESTS = [WebhookRequestType.Telegram, WebhookRequestType.VK];
