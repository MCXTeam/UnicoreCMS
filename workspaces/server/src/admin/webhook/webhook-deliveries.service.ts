import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, LessThan, Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { News } from 'src/admin/news/entities/news.entity';
import { htmlToSocial, truncate } from 'src/common/social/html-to-social';
import {
  KEEP_WEBHOOK_DELIVERIES_DAYS,
  WEBHOOK_BACKOFF_BASE_MS,
  WEBHOOK_BACKOFF_MAX_MS,
  WEBHOOK_BATCH_LIMIT,
  WEBHOOK_ERROR_MAX_LENGTH,
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_STALE_MS,
} from 'src/common/constants';
import { NewsPost, WebhookChannel } from './channels/channel.interface';
import { DiscordChannel } from './channels/discord.channel';
import { JsonChannel } from './channels/json.channel';
import { TelegramChannel } from './channels/telegram.channel';
import { VkChannel } from './channels/vk.channel';
import { moduleWebhookChannels } from 'src/modules/runtime';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { Webhook } from './entities/webhook.entity';
import { WebhookDeliveryAction } from './enums/webhook-delivery-action.enum';
import { WebhookDeliveryStatus } from './enums/webhook-delivery-status.enum';
import { WebhookRequestType } from './enums/webhook-request-type';
import { WebhookType } from './enums/webhook-type.enum';

export enum PublishMode {
  Auto = 'auto',
  Update = 'update',
  Create = 'create',
}

@Injectable()
export class WebhookDeliveriesService {
  private readonly logger = new Logger('WebhookDeliveriesService');
  private readonly worker = randomUUID();
  private readonly channels: Map<string, WebhookChannel>;
  private processing = false;

  constructor(
    @InjectRepository(WebhookDelivery) private deliveriesRepository: Repository<WebhookDelivery>,
    @InjectRepository(Webhook) private webhooksRepository: Repository<Webhook>,
    @InjectRepository(News) private newsRepository: Repository<News>,
    discord: DiscordChannel,
    telegram: TelegramChannel,
    vk: VkChannel,
    json: JsonChannel,
  ) {
    this.channels = new Map(
      [discord, telegram, vk, json, ...(moduleWebhookChannels() as WebhookChannel[])].map((channel) => [channel.request, channel]),
    );
  }

  channel(request: WebhookRequestType): WebhookChannel {
    return this.channels.get(request);
  }

  channelNames(): string[] {
    return [...this.channels.keys()];
  }

  async broadcast(request: string, post: NewsPost): Promise<number> {
    const channel = this.channel(request as WebhookRequestType);

    if (!channel) throw new Error(`Канал ${request} недоступен`);

    const webhooks = (await this.targets()).filter((webhook) => String(webhook.request) === request);
    let sent = 0;

    for (const webhook of webhooks) {
      try {
        await channel.publish(webhook, { ...post, text: htmlToSocial(post.text, channel.format) });
        sent += 1;
      } catch (error: any) {
        this.logger.warn(
          `Рассылка в вебхук ${webhook.id}: ${truncate(error?.message || String(error), WEBHOOK_ERROR_MAX_LENGTH)}`,
        );
      }
    }

    return sent;
  }

  buildPost(news: News, request: WebhookRequestType): NewsPost {
    const channel = this.channel(request);
    const url = news.link || `${String(envConfig.baseurl || '').replace(/\/$/, '')}/news/${news.id}`;
    const image = news.image ? new URL(news.image, `${String(envConfig.apiBaseurl || '').replace(/\/$/, '')}/`).href : undefined;
    const source = news.description || news.short_description || '';

    return {
      title: news.title,
      text: channel ? htmlToSocial(source, channel.format) : source,
      url,
      image,
    };
  }

  findByNews(newsId: number): Promise<WebhookDelivery[]> {
    return this.deliveriesRepository.find({ where: { newsId }, order: { id: 'DESC' } });
  }

  targets(): Promise<Webhook[]> {
    return this.webhooksRepository.find({ where: { type: WebhookType.NewsCreated }, order: { id: 'ASC' } });
  }

  allTargets(): Promise<Webhook[]> {
    return this.webhooksRepository.find({ order: { id: 'ASC' } });
  }

  async deliverById(id: number, post: NewsPost): Promise<number> {
    const webhook = await this.webhooksRepository.findOneBy({ id });

    if (!webhook) throw new Error(`Вебхук ${id} не найден`);

    const channel = this.channel(webhook.request as WebhookRequestType);

    if (!channel) throw new Error(`Канал ${webhook.request} недоступен`);

    const response = await channel.publish(webhook, { ...post, text: htmlToSocial(post.text, channel.format) });

    return response.code ?? 0;
  }

  async enqueueNews(news: News, mode: PublishMode = PublishMode.Auto, selected?: number[]): Promise<WebhookDelivery[]> {
    const webhooks = await this.targets();
    const queued: WebhookDelivery[] = [];

    for (const webhook of webhooks) {
      if (selected ? !selected.includes(webhook.id) : mode === PublishMode.Auto && !webhook.auto_publish) continue;

      const previous = await this.deliveriesRepository.findOne({
        where: { webhookId: webhook.id, newsId: news.id, status: WebhookDeliveryStatus.Sent },
        order: { id: 'DESC' },
      });

      const delivery = this.deliveriesRepository.create({
        webhookId: webhook.id,
        newsId: news.id,
        status: WebhookDeliveryStatus.Pending,
        attempts: 0,
        messageId: mode === PublishMode.Create ? null : previous?.messageId ?? null,
      });

      queued.push(await this.deliveriesRepository.save(delivery));
    }

    return queued;
  }

  async enqueueUpdate(news: News): Promise<WebhookDelivery[]> {
    const sent = await this.deliveriesRepository.find({
      where: { newsId: news.id, status: WebhookDeliveryStatus.Sent },
      order: { id: 'DESC' },
    });

    const seen = new Set<number>();
    const queued: WebhookDelivery[] = [];

    for (const delivery of sent) {
      if (seen.has(delivery.webhookId) || !delivery.messageId) continue;

      seen.add(delivery.webhookId);

      if (!delivery.webhook?.update_on_edit) continue;

      queued.push(
        await this.deliveriesRepository.save(
          this.deliveriesRepository.create({
            webhookId: delivery.webhookId,
            newsId: news.id,
            status: WebhookDeliveryStatus.Pending,
            attempts: 0,
            messageId: delivery.messageId,
          }),
        ),
      );
    }

    return queued;
  }

  async removePosts(newsId: number): Promise<void> {
    const sent = await this.deliveriesRepository.find({
      where: { newsId, status: WebhookDeliveryStatus.Sent, action: WebhookDeliveryAction.Publish },
      order: { id: 'DESC' },
    });

    const seen = new Set<string>();

    for (const delivery of sent) {
      if (!delivery.messageId || seen.has(`${delivery.webhookId}:${delivery.messageId}`)) continue;

      seen.add(`${delivery.webhookId}:${delivery.messageId}`);

      if (!this.channel(delivery.webhook?.request)?.remove) continue;

      await this.deliveriesRepository.save(
        this.deliveriesRepository.create({
          webhookId: delivery.webhookId,
          newsId: null,
          action: WebhookDeliveryAction.Remove,
          status: WebhookDeliveryStatus.Pending,
          attempts: 0,
          messageId: delivery.messageId,
        }),
      );
    }
  }

  async retry(id: number): Promise<WebhookDelivery> {
    const delivery = await this.deliveriesRepository.findOneBy({ id });

    if (!delivery) return null;

    await this.deliveriesRepository.update(
      { id },
      { status: WebhookDeliveryStatus.Pending, attempts: 0, nextAttempt: null, error: null, worker: null },
    );

    return this.deliveriesRepository.findOneBy({ id });
  }

  private async releaseStale(): Promise<void> {
    await this.deliveriesRepository
      .createQueryBuilder()
      .update()
      .set({ status: WebhookDeliveryStatus.Pending, worker: null })
      .where('status = :pending AND worker IS NOT NULL AND updated <= :deadline', {
        pending: WebhookDeliveryStatus.Pending,
        deadline: new Date(Date.now() - WEBHOOK_STALE_MS),
      })
      .execute();
  }

  private async claim(): Promise<WebhookDelivery[]> {
    const claimed = await this.deliveriesRepository
      .createQueryBuilder()
      .update()
      .set({ worker: this.worker })
      .where('status = :pending AND worker IS NULL AND (next_attempt IS NULL OR next_attempt <= :now)', {
        pending: WebhookDeliveryStatus.Pending,
        now: new Date(),
      })
      .limit(WEBHOOK_BATCH_LIMIT)
      .execute();

    if (!claimed.affected) return [];

    return this.deliveriesRepository.find({
      where: { status: WebhookDeliveryStatus.Pending, worker: this.worker },
      order: { id: 'ASC' },
    });
  }

  async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.releaseStale();

      for (const delivery of await this.claim()) await this.deliver(delivery);
    } finally {
      this.processing = false;
    }
  }

  private async deliver(delivery: WebhookDelivery): Promise<void> {
    const webhook = delivery.webhook ?? (await this.webhooksRepository.findOneBy({ id: delivery.webhookId }));
    const news = delivery.newsId ? await this.newsRepository.findOneBy({ id: delivery.newsId }) : null;

    try {
      const channel = this.channel(webhook?.request);

      if (!webhook || !channel) throw new Error('Канал доставки недоступен');

      if (delivery.action === WebhookDeliveryAction.Remove) {
        if (!channel.remove) throw new Error('Канал не умеет удалять посты');

        await channel.remove(webhook, delivery.messageId);

        delivery.status = WebhookDeliveryStatus.Sent;
        delivery.error = null;
        delivery.sentAt = new Date();
        delivery.worker = null;

        await this.deliveriesRepository.save(delivery);

        return;
      }

      if (delivery.newsId && !news) throw new Error('Новость удалена');

      const post = this.buildPost(news, webhook.request);
      const result =
        delivery.messageId && channel.edit
          ? await channel.edit(webhook, post, delivery.messageId, news)
          : await channel.publish(webhook, post, news);

      delivery.status = WebhookDeliveryStatus.Sent;
      delivery.messageId = result.messageId ?? delivery.messageId;
      delivery.code = result.code ?? null;
      delivery.error = result.warning ? truncate(result.warning, WEBHOOK_ERROR_MAX_LENGTH) : null;
      delivery.sentAt = new Date();
      delivery.worker = null;

      await this.deliveriesRepository.save(delivery);
    } catch (error: any) {
      delivery.attempts += 1;
      delivery.code = error?.response?.status ?? error?.code ?? null;
      delivery.error = truncate(error?.message || String(error), WEBHOOK_ERROR_MAX_LENGTH);
      delivery.worker = null;

      if (delivery.attempts >= WEBHOOK_MAX_ATTEMPTS) {
        delivery.status = WebhookDeliveryStatus.Failed;
        this.logger.warn(`Доставка #${delivery.id} (вебхук ${delivery.webhookId}) окончательно не удалась: ${delivery.error}`);
      } else {
        delivery.nextAttempt = new Date(
          Date.now() + Math.min(WEBHOOK_BACKOFF_BASE_MS * 2 ** (delivery.attempts - 1), WEBHOOK_BACKOFF_MAX_MS),
        );
      }

      await this.deliveriesRepository.save(delivery);
    }
  }

  async cleanup(days = KEEP_WEBHOOK_DELIVERIES_DAYS): Promise<void> {
    if (days <= 0) return;

    await this.deliveriesRepository.delete({
      status: In([WebhookDeliveryStatus.Sent, WebhookDeliveryStatus.Failed]),
      created: LessThan(new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
    });
  }
}
