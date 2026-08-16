import { BadRequestException, Injectable } from '@nestjs/common';
import { envConfig } from 'unicore-common';
// @ts-ignore
import { VK } from 'vk-io';
import { VK_MESSAGE_LIMIT } from 'src/common/constants';
import { truncate } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { Webhook } from '../entities/webhook.entity';
import { DeliveryResult, NewsPost, WebhookChannel } from './channel.interface';

@Injectable()
export class VkChannel implements WebhookChannel {
  readonly request = WebhookRequestType.VK;
  readonly format = SocialFormat.PlainText;

  private vk: VK;

  private api(): VK {
    if (!envConfig.vkApiKey) throw new BadRequestException('Не задан VK_APIKEY');

    if (!this.vk) this.vk = new VK({ token: envConfig.vkApiKey });

    return this.vk;
  }

  private ownerId(webhook: Webhook): number {
    const parsed = Number(webhook.target);

    if (!webhook.target || !Number.isInteger(parsed) || parsed === 0) throw new BadRequestException('Не указан ID сообщества VK');

    return parsed > 0 ? -parsed : parsed;
  }

  private body(post: NewsPost): string {
    const title = post.title ? `${post.title}\n\n` : '';
    const link = post.url ? `\n\n${post.url}` : '';

    return truncate(`${title}${post.text}${link}`, VK_MESSAGE_LIMIT);
  }

  private async attachment(post: NewsPost, ownerId: number): Promise<string | undefined> {
    if (!post.image) return undefined;

    const photo = await this.api()
      .upload.wallPhoto({ source: { value: post.image }, group_id: Math.abs(ownerId) })
      .catch(() => null);

    return photo ? photo.toString() : undefined;
  }

  async publish(webhook: Webhook, post: NewsPost): Promise<DeliveryResult> {
    const owner_id = this.ownerId(webhook);
    const attachments = await this.attachment(post, owner_id);

    const result = await this.api().api.wall.post({
      owner_id,
      from_group: 1,
      message: this.body(post),
      attachments,
    });

    return { messageId: String(result.post_id) };
  }

  async remove(webhook: Webhook, messageId: string): Promise<void> {
    await this.api().api.wall.delete({ owner_id: this.ownerId(webhook), post_id: Number(messageId) });
  }

  async edit(webhook: Webhook, post: NewsPost, messageId: string): Promise<DeliveryResult> {
    const owner_id = this.ownerId(webhook);
    const attachments = await this.attachment(post, owner_id);

    await this.api().api.wall.edit({
      owner_id,
      post_id: Number(messageId),
      message: this.body(post),
      attachments,
    });

    return { messageId };
  }
}
