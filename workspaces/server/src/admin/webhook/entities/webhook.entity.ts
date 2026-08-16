import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { WebhookType } from '../enums/webhook-type.enum';

@Entity({ name: 'unicore_webhooks' })
export class Webhook {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type' })
  type: WebhookType;

  @Column({ name: 'request' })
  request: WebhookRequestType;

  @Column({ name: 'url', nullable: true })
  url?: string;

  @Column({ name: 'target', nullable: true })
  target?: string;

  @Column({ name: 'auto_publish', default: true })
  auto_publish: boolean;

  @Column({ name: 'update_on_edit', default: true })
  update_on_edit: boolean;
}
