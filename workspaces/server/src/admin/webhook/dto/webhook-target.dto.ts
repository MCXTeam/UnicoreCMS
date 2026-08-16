import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import { Webhook } from '../entities/webhook.entity';
import { WebhookDeliveryStatus } from '../enums/webhook-delivery-status.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';

export class WebhookTargetDto {
  id: number;
  name: string;
  request: WebhookRequestType;
  auto_publish: boolean;
  update_on_edit: boolean;

  constructor(webhook: Webhook) {
    this.id = webhook.id;
    this.name = webhook.name;
    this.request = webhook.request;
    this.auto_publish = webhook.auto_publish;
    this.update_on_edit = webhook.update_on_edit;
  }
}

export class WebhookDeliveryDto {
  id: number;
  webhook: WebhookTargetDto;
  status: WebhookDeliveryStatus;
  attempts: number;
  code?: number;
  error?: string;
  messageId?: string;
  nextAttempt?: Date;
  sentAt?: Date;
  created: Date;

  constructor(delivery: WebhookDelivery) {
    this.id = delivery.id;
    this.webhook = delivery.webhook ? new WebhookTargetDto(delivery.webhook) : null;
    this.status = delivery.status;
    this.attempts = delivery.attempts;
    this.code = delivery.code;
    this.error = delivery.error;
    this.messageId = delivery.messageId;
    this.nextAttempt = delivery.nextAttempt;
    this.sentAt = delivery.sentAt;
    this.created = delivery.created;
  }
}
