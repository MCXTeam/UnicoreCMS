import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { WebhookType } from '../enums/webhook-type.enum';

@Entity({ name: "unicore_webhooks" })
export class Webhook {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "type" })
  type: WebhookType;

  @Column({ name: "request" })
  request: WebhookRequestType;

  @Column({ name: "url" })
  url: string;
}
