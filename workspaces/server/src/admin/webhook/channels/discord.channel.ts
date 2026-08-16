import { BadRequestException, Injectable } from '@nestjs/common';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import { DISCORD_EMBED_DESCRIPTION_LIMIT, DISCORD_EMBED_TITLE_LIMIT, DISCORD_WEBHOOK_HOSTS } from 'src/common/constants';
import { truncate } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { Webhook } from '../entities/webhook.entity';
import { DeliveryResult, NewsPost, WebhookChannel } from './channel.interface';

@Injectable()
export class DiscordChannel implements WebhookChannel {
  readonly request = WebhookRequestType.Discord;
  readonly format = SocialFormat.DiscordMarkdown;

  private client(webhook: Webhook): WebhookClient {
    if (!this.isDiscordUrl(webhook.url)) throw new BadRequestException('Адрес вебхука не похож на Discord');

    return new WebhookClient({ url: webhook.url });
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

  private embed(post: NewsPost): EmbedBuilder {
    const embed = new EmbedBuilder();

    if (post.title) embed.setTitle(truncate(post.title, DISCORD_EMBED_TITLE_LIMIT));
    if (post.url) embed.setURL(post.url);
    if (post.text) embed.setDescription(truncate(post.text, DISCORD_EMBED_DESCRIPTION_LIMIT));
    if (post.image) embed.setImage(post.image);

    return embed;
  }

  async publish(webhook: Webhook, post: NewsPost): Promise<DeliveryResult> {
    const message = await this.client(webhook).send({ embeds: [this.embed(post)] });

    return { messageId: message.id };
  }

  async remove(webhook: Webhook, messageId: string): Promise<void> {
    await this.client(webhook).deleteMessage(messageId);
  }

  async edit(webhook: Webhook, post: NewsPost, messageId: string): Promise<DeliveryResult> {
    const message = await this.client(webhook).editMessage(messageId, { embeds: [this.embed(post)] });

    return { messageId: message.id };
  }
}
