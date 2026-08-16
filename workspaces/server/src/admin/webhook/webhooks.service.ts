import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AttachmentBuilder, EmbedBuilder, HexColorString } from 'discord.js';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { News } from '../news/entities/news.entity';
import { WebhookInput } from './dto/webhook.input';
import { Webhook } from './entities/webhook.entity';
import { WebhookRequestType } from './enums/webhook-request-type';
import { WebhookType } from './enums/webhook-type.enum';
import { VkLongpollService } from '../integrations/vk-longpoll/vk-longpoll.service';
import { AttachmentType } from 'vk-io';
import { envConfig } from 'unicore-common';
import { DISCORD_WEBHOOK_HOSTS, StorageManager, WEBHOOK_TIMEOUT_MS } from '@common';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhooksService');

  constructor(
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    private httpService: HttpService,
    private vkService: VkLongpollService,
  ) {}

  async send(type: WebhookType, payload: any): Promise<void> {
    const webhooks = await this.webhooksRepository.findBy({ type });

    if (webhooks.length == 0) return;

    for (const wh of webhooks) {
      try {
        if (wh.type == WebhookType.NewsCreated) {
          if (payload.image) {
            const url = new URL(envConfig.apiBaseurl);
            url.pathname = payload.image;
            payload.image = url.href;
          }
        }

        switch (wh.request) {
          case WebhookRequestType.Discord:
            if (!this.isDiscordUrl(wh.url)) continue;

            switch (wh.type) {
              // Срабатывает, когда на сайте добавлена новая новость
              case WebhookType.NewsCreated:
                await this.newsCreatedDiscord(wh.url, payload);
                break;
              // Срабатывает, когда VK LongPool получил новую новость
              case WebhookType.VKNewsCreated:
                await this.vkNewsCreatedDiscord(wh.url, payload);
                break;
              default:
                continue;
            }
            break;
          default:
            await this.post(wh.url, payload);
            break;
        }
      } catch (error) {
        this.logger.error(`Webhook ${wh.id} (${wh.url}) failed: ${error}`);
      }
    }
  }

  private isDiscordUrl(url: string): boolean {
    try {
      const { protocol, hostname } = new URL(url);

      if (protocol !== 'https:') return false;

      return DISCORD_WEBHOOK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  private async post(url: string, payload: unknown) {
    if (!(await StorageManager.isSafeUrl(url))) {
      this.logger.error(`Blocked unsafe webhook url: ${url}`);
      return;
    }

    await firstValueFrom(this.httpService.post(url, payload, { timeout: WEBHOOK_TIMEOUT_MS, maxRedirects: 0 }));
  }

  private newsCreatedDiscord(url: string, payload: News) {}

  private vkNewsCreatedDiscord(url: string, payload: any) {
    return this.vkService.DiscordParse(url, payload);
  }

  find(): Promise<Webhook[]> {
    return this.webhooksRepository.find();
  }

  findOne(id: number): Promise<Webhook> {
    return this.webhooksRepository.findOneBy({ id });
  }

  create(input: WebhookInput): Promise<Webhook> {
    const wh = new Webhook();

    wh.name = input.name;
    wh.request = input.request;
    wh.type = input.type;
    wh.url = input.url;

    return this.webhooksRepository.save(wh);
  }

  async update(id: number, input: WebhookInput): Promise<Webhook> {
    const wh = await this.findOne(id);

    if (!wh) {
      throw new NotFoundException();
    }

    wh.name = input.name;
    wh.request = input.request;
    wh.type = input.type;
    wh.url = input.url;

    return this.webhooksRepository.save(wh);
  }

  async remove(id: number): Promise<Webhook> {
    const wh = await this.findOne(id);

    if (!wh) {
      throw new NotFoundException();
    }

    return this.webhooksRepository.remove(wh);
  }

  async removeMany(ids: number[]): Promise<Webhook[]> {
    const whs = await this.webhooksRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.webhooksRepository.remove(whs);
  }
}
