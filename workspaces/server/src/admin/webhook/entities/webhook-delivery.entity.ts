import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { News } from 'src/admin/news/entities/news.entity';
import { WebhookDeliveryAction } from '../enums/webhook-delivery-action.enum';
import { WebhookDeliveryStatus } from '../enums/webhook-delivery-status.enum';
import { Webhook } from './webhook.entity';

@Entity({ name: 'unicore_webhook_deliveries' })
export class WebhookDelivery {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => Webhook, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'webhook_id' })
  webhook: Webhook;

  @Column({ name: 'webhook_id' })
  webhookId: number;

  @ManyToOne(() => News, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'news_id' })
  news?: News;

  @Column({ name: 'news_id', nullable: true })
  newsId?: number;

  @Column({ name: 'status', default: WebhookDeliveryStatus.Pending })
  status: WebhookDeliveryStatus;

  @Column({ name: 'action', default: WebhookDeliveryAction.Publish })
  action: WebhookDeliveryAction;

  @Column({ name: 'attempts', default: 0 })
  attempts: number;

  @Column({ name: 'code', nullable: true })
  code?: number;

  @Column('text', { name: 'error', nullable: true })
  error?: string;

  @Column({ name: 'message_id', nullable: true })
  messageId?: string;

  @Column({ name: 'worker', nullable: true })
  worker?: string;

  @Column({ name: 'next_attempt', type: 'datetime', nullable: true })
  nextAttempt?: Date;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
