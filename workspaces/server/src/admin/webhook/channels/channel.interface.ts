import { News } from 'src/admin/news/entities/news.entity';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { Webhook } from '../entities/webhook.entity';

export interface NewsPost {
  title: string;
  text: string;
  url?: string;
  image?: string;
}

export interface DeliveryResult {
  messageId?: string;
  code?: number;
  warning?: string;
}

export interface WebhookChannel {
  readonly request: string;
  readonly format: SocialFormat;

  publish(webhook: Webhook, post: NewsPost, news?: News): Promise<DeliveryResult>;
  edit?(webhook: Webhook, post: NewsPost, messageId: string, news?: News): Promise<DeliveryResult>;
  remove?(webhook: Webhook, messageId: string): Promise<void>;
}
