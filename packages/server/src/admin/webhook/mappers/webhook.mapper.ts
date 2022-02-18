import { WebhookRequestType } from '../enums/webhook-request-type';
import { WebhookType } from '../enums/webhook-type.enum';

export const WebhookMapper = [
  {
    id: WebhookType.NewsCreated,
    description: 'Срабатывает, когда на сайте добавлена новая новость',
    supports: [WebhookRequestType.Discord, WebhookRequestType.JSON],
  },

  {
    id: WebhookType.VKNewsCreated,
    description: 'Срабатывает, когда VK LongPool получил новую новость',
    supports: [WebhookRequestType.Discord, WebhookRequestType.JSON],
  },
];
