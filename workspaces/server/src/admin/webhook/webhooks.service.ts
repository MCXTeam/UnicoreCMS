import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WebhookInput } from './dto/webhook.input';
import { Webhook } from './entities/webhook.entity';
import { WebhookRequestType } from './enums/webhook-request-type';
import { WebhookType } from './enums/webhook-type.enum';
import { VkLongpollService } from '../integrations/vk-longpoll/vk-longpoll.service';
import { DISCORD_WEBHOOK_HOSTS, StorageManager, WEBHOOK_TIMEOUT_MS } from '@common';
import { webhookChannelFields } from 'unicore-common';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhooksService');

  constructor(
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    private httpService: HttpService,
    @Inject(forwardRef(() => VkLongpollService))
    private vkService: VkLongpollService,
  ) {}

  async send(type: WebhookType, payload: any): Promise<void> {
    const webhooks = await this.webhooksRepository.findBy({ type });

    if (webhooks.length == 0) return;

    for (const wh of webhooks) {
      try {
        switch (wh.request) {
          case WebhookRequestType.Discord:
            if (!this.isDiscordUrl(wh.url)) continue;
            if (wh.type !== WebhookType.VKNewsCreated) continue;

            await this.vkNewsCreatedDiscord(wh.url, payload);
            break;
          case WebhookRequestType.JSON:
            await this.post(wh.url, payload);
            break;
          default:
            continue;
        }
      } catch (error) {
        this.logger.error(`Вебхук ${wh.id} (${wh.name}) не отработал: ${error}`);
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

  private vkNewsCreatedDiscord(url: string, payload: any) {
    return this.vkService.DiscordParse(url, payload);
  }

  find(): Promise<Webhook[]> {
    return this.webhooksRepository.find();
  }

  findOne(id: number): Promise<Webhook> {
    return this.webhooksRepository.findOneBy({ id });
  }

  private apply(wh: Webhook, input: WebhookInput): void {
    const fields = webhookChannelFields(input.request);
    const keeps = (field: 'url' | 'target') => !fields.length || fields.includes(field);

    wh.name = input.name;
    wh.request = input.request;
    wh.type = input.type;
    wh.url = keeps('url') ? (input.url ?? null) : null;
    wh.target = keeps('target') || input.request === WebhookRequestType.Discord ? (input.target ?? null) : null;
    wh.auto_publish = input.auto_publish ?? true;
    wh.update_on_edit = input.update_on_edit ?? true;

    if (fields.includes('url') && !wh.url) throw new BadRequestException(`Каналу «${input.request}» нужен адрес вебхука`);

    if (fields.includes('target') && !wh.target) throw new BadRequestException(`Каналу «${input.request}» нужен канал публикации`);

    if (input.request === WebhookRequestType.Discord && wh.target && !/^\d{17,25}$/.test(wh.target))
      throw new BadRequestException('Для упоминания роли нужен числовой ID роли Discord');
  }

  create(input: WebhookInput): Promise<Webhook> {
    const wh = new Webhook();

    this.apply(wh, input);

    return this.webhooksRepository.save(wh);
  }

  async update(id: number, input: WebhookInput): Promise<Webhook> {
    const wh = await this.findOne(id);

    if (!wh) {
      throw new NotFoundException();
    }

    this.apply(wh, input);

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
