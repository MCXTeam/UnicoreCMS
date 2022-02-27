import { HttpService } from '@nestjs/axios';
import { HexColorString, MessageAttachment, MessageEmbed } from 'discord.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { News } from '../news/entities/news.entity';
import { WebhookInput } from './dto/webhook.input';
import { Webhook } from './entities/webhook.entity';
import { WebhookRequestType } from './enums/webhook-request-type';
import { WebhookType } from './enums/webhook-type.enum';
import { VkLongpollService } from '../integrations/vk-longpoll/vk-longpoll.service';
import { AttachmentType } from 'vk-io';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private webhooksRepository: Repository<Webhook>,
    private httpService: HttpService,
    private vkService: VkLongpollService,
  ) {}

  async send(type: WebhookType, payload: any): Promise<void> {
    const webhooks = await this.webhooksRepository.find({ type });

    if (webhooks.length == 0) return;

    for (const wh of webhooks) {
      switch (wh.request) {
        case WebhookRequestType.Discord:
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
          await this.httpService.post(wh.url, payload);
          break;
      }
    }
  }

  private newsCreatedDiscord(url: string, payload: News) {}

  private vkNewsCreatedDiscord(url: string, payload: any) {
    this.vkService.DiscordParse(url, payload);
  }

  find(): Promise<Webhook[]> {
    return this.webhooksRepository.find();
  }

  findOne(id: number): Promise<Webhook> {
    return this.webhooksRepository.findOne(id);
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
