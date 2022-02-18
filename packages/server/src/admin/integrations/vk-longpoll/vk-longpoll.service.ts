import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from 'src/admin/news/entities/news.entity';
import { WebhooksService } from 'src/admin/webhook/webhooks.service';
import { Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
// @ts-ignore
import { IResolvedOwnerResource, IResolvedTargetResource, ISharedAttachmentPayload, resolveResource, VK } from 'vk-io';
import { getById, getPostLink } from './utils';
import { replaceAsync, StorageManager } from '@common';
import { WebhookType } from 'src/admin/webhook/enums/webhook-type.enum';
import { VK_LINK_PREFIX } from './constants/vk-link-prefix';
import { MessageEmbed, WebhookClient } from 'discord.js';

@Injectable()
export class VkLongpollService {
  private readonly logger = new Logger(VkLongpollService.name);
  protected VK: VK;

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @Inject(forwardRef(() => WebhooksService))
    private webhooksService: WebhooksService,
  ) {}

  resolveResource(resource: string): Promise<IResolvedTargetResource | IResolvedOwnerResource> {
    return resolveResource({
      resource,
      api: this.VK.api,
    });
  }

  async toHtml(text: string): Promise<string> {
    // Fix ссылок
    text = text.replace(
      /\[([^[]+?)\|([^]+?)]/g,
      (match, link, title) => `<a href="${!link.startsWith(VK_LINK_PREFIX) ? VK_LINK_PREFIX : ''}${link}" target="_blank">${title}</a>`,
    );

    // Fix хештегов
    text = await replaceAsync(text, /(?:^|\s)#([^\s]+)/g, async (match, hashtag): Promise<string> => {
      const space = match.startsWith('\n') ? '\n' : match.startsWith(' ') ? ' ' : '';

      const isNavigationHashtag = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

      if (isNavigationHashtag) {
        const [, hashtag, group] = isNavigationHashtag;

        const resource = await this.resolveResource(group).catch(() => null);

        if (resource?.type === 'group') {
          if (hashtag.match(/[a-zA-Z]+/)) {
            return `${space}<a href="https://vk.com/${group}/${hashtag}" target="_blank">#${hashtag}@${group}</a>`;
          }

          return `${space}<a href="https://vk.com/wall-${resource.id}?q=%23${hashtag}" target="_blank">#${hashtag}@${group}</a>`;
        }
      }

      return `${space}<a href="https://vk.com/feed?section=search&q=%23${hashtag}" target="_blank">#${hashtag}</a>`;
    });

    try {
      return decodeURI(text);
    } catch {
      return text;
    }
  }

  async toMarkdown(text: string): Promise<string> {
    // Fix ссылок
    text = text.replace(
      /\[([^[]+?)\|([^]+?)]/g,
      (match, link, title) => `[${title}](${!link.startsWith(VK_LINK_PREFIX) ? VK_LINK_PREFIX : ''}${link})`,
    );

    // Fix хештегов
    text = await replaceAsync(text, /(?:^|\s)#([^\s]+)/g, async (match, hashtag): Promise<string> => {
      const space = match.startsWith('\n') ? '\n' : match.startsWith(' ') ? ' ' : '';

      const isNavigationHashtag = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

      if (isNavigationHashtag) {
        const [, hashtag, group] = isNavigationHashtag;

        const resource = await this.resolveResource(group).catch(() => null);

        if (resource?.type === 'group') {
          if (hashtag.match(/[a-zA-Z]+/)) {
            return `${space}[#${hashtag}@${group}](https://vk.com/${group}/${hashtag})`;
          }

          return `${space}[#${hashtag}@${group}](https://vk.com/wall-${resource.id}?q=%23${hashtag})`;
        }
      }

      return `${space}[#${hashtag}](https://vk.com/feed?section=search&q=%23${hashtag})`;
    });

    try {
      return decodeURI(text);
    } catch {
      return text;
    }
  }

  async DiscordParse(url: string, payload: any) {
    const webhookClient = new WebhookClient({ url });
    let { text, attachments } = payload;
    const embed = new MessageEmbed();
    const postAuthor = await getById(this.VK.api, payload.from_id);
    const imageurl = attachments?.find((att) => att.type == 'photo')?.photo?.sizes?.at(-1)?.url;

    if (postAuthor) {
      embed.setAuthor({
        name: postAuthor.name,
        iconURL: postAuthor.photo_50,
        url: getPostLink(payload),
      });
    }

    if (text) {
      if (text.length > 4096) text = text.slice(0, 4096) + '...';

      embed.setDescription(await this.toMarkdown(text));
    }

    if (imageurl) {
      embed.setImage(imageurl);
    }

    webhookClient.send({
      embeds: [embed],
    });
  }

  async init() {
    const vk = new VK({
      token: envConfig.vkApiKey,
      apiMode: 'parallel',
    });

    vk.updates.on('wall_post_new', async (context) => {
      const payload: any = context['payload'];

      if (payload.post_type === 'post' && payload.text) {
        // const postAuthor = await getById(vk.api, payload.from_id);

        // Add news to repo
        const imageurl = payload.attachments?.find((att) => att.type == 'photo')?.photo?.sizes?.at(-1)?.url;

        const news = new News();

        news.description = await this.toHtml(payload.text);
        news.title = payload.text.slice(0, 30);
        news.link = await getPostLink(payload);

        if (news.title < news.description) news.title += '...';

        if (imageurl) {
          news.image = await StorageManager.saveFromUrl(imageurl);
        }

        await this.newsRepository.save(news);

        // Sending webhooks
        this.webhooksService.send(WebhookType.VKNewsCreated, payload);
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
