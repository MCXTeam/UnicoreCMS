import { BadRequestException, Injectable } from '@nestjs/common';
import { DISCORD_EMBED_DESCRIPTION_LIMIT, DISCORD_EMBED_TITLE_LIMIT } from 'src/common/constants';
import {
  DiscordEmbed,
  discordDelete,
  discordEdit,
  discordEmbed,
  discordSend,
  isDiscordWebhookUrl,
} from 'src/common/social/discord-webhook';
import { truncate } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { Webhook } from '../entities/webhook.entity';
import { DeliveryResult, NewsPost, WebhookChannel } from './channel.interface';

@Injectable()
export class DiscordChannel implements WebhookChannel {
  readonly request = WebhookRequestType.Discord;
  readonly format = SocialFormat.DiscordMarkdown;

  private url(webhook: Webhook): string {
    if (!isDiscordWebhookUrl(webhook.url)) throw new BadRequestException('Адрес вебхука не похож на Discord');

    return webhook.url;
  }

  private embed(post: NewsPost): DiscordEmbed {
    return discordEmbed({
      title: post.title && truncate(post.title, DISCORD_EMBED_TITLE_LIMIT),
      url: post.url,
      description: post.text && truncate(post.text, DISCORD_EMBED_DESCRIPTION_LIMIT),
      image: post.image,
    });
  }

  async publish(webhook: Webhook, post: NewsPost): Promise<DeliveryResult> {
    const content = webhook.target ? `<@&${webhook.target}>` : undefined;
    const message = await discordSend(this.url(webhook), { content, embeds: [this.embed(post)] });

    return { messageId: message.id };
  }

  async remove(webhook: Webhook, messageId: string): Promise<void> {
    await discordDelete(this.url(webhook), messageId);
  }

  async edit(webhook: Webhook, post: NewsPost, messageId: string): Promise<DeliveryResult> {
    const message = await discordEdit(this.url(webhook), messageId, { embeds: [this.embed(post)] });

    return { messageId: message.id };
  }
}
