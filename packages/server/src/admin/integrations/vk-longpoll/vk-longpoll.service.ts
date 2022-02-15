import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from 'src/admin/news/entities/news.entity';
import { WebhooksService } from 'src/admin/webhook/webhooks.service';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
// @ts-ignore
import { VK } from 'vk-io';
import { getById, getPostLink } from './utils';
import axios from 'axios'
import { StorageManager } from '@common';

@Injectable()
export class VkLongpollService {
  private readonly logger = new Logger(VkLongpollService.name);
  protected VK: VK;

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private webhooksService: WebhooksService,
  ) { }

  async init() {
    const vk = new VK({
      token: envConfig.vkApiKey,
      apiMode: 'parallel',
    });

    vk.updates.on('wall_post_new', async (context) => {
      const payload: any = context['payload'];

      if (payload.post_type === 'post' && payload.text) {
        // const postAuthor = await getById(vk.api, payload.from_id);
        // const postLink = await getPostLink(payload);
        const imageurl = payload.attachments?.find(att => att.type == "photo")?.photo?.sizes?.at(-1)?.url

        const news = new News()

        news.description = payload.text
        news.title = payload.text.slice(0, 30)

        if (news.title < news.description)
          news.title += '...';

        if (imageurl) {
          news.image = await StorageManager.saveFromUrl(imageurl)
        }

        await this.newsRepository.save(news)
      }
    });

    await vk.updates
      .start()
      .then(() => this.logger.log(`Connected to VKontakte using LongPoll!`))
      .catch((error) => {
        this.logger.error(`An error occurred when connecting to LongPoll VKontakte!`);
        this.logger.error(error);
      });

    this.VK = vk;
  }
}
