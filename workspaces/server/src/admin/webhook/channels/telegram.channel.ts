import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { envConfig } from 'unicore-common';
import { TELEGRAM_API_BASEURL, TELEGRAM_CAPTION_LIMIT, TELEGRAM_MESSAGE_LIMIT, WEBHOOK_TIMEOUT_MS } from 'src/common/constants';
import { truncate } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { Webhook } from '../entities/webhook.entity';
import { DeliveryResult, NewsPost, WebhookChannel } from './channel.interface';

@Injectable()
export class TelegramChannel implements WebhookChannel {
  readonly request = WebhookRequestType.Telegram;
  readonly format = SocialFormat.TelegramHtml;

  constructor(private httpService: HttpService) {}

  private async call(method: string, payload: Record<string, unknown>): Promise<any> {
    if (!envConfig.telegramBotToken) throw new BadRequestException('Не задан TELEGRAM_BOT_TOKEN');

    const response = await firstValueFrom(
      this.httpService.post(`${TELEGRAM_API_BASEURL}/bot${envConfig.telegramBotToken}/${method}`, payload, {
        timeout: WEBHOOK_TIMEOUT_MS,
        maxRedirects: 0,
        validateStatus: () => true,
      }),
    );

    if (!response.data?.ok) throw new Error(`Telegram ${method}: ${response.data?.description || `HTTP ${response.status}`}`);

    return response.data.result;
  }

  private body(post: NewsPost): string {
    const title = post.title ? `<b>${post.title}</b>\n\n` : '';
    const link = post.url ? `\n\n<a href="${post.url}">Читать на сайте</a>` : '';

    return `${title}${post.text}${link}`;
  }

  private chat(webhook: Webhook): string {
    if (!webhook.target) throw new BadRequestException('Не указан чат Telegram');

    return webhook.target;
  }

  async publish(webhook: Webhook, post: NewsPost): Promise<DeliveryResult> {
    const chat_id = this.chat(webhook);
    const body = this.body(post);
    let warning: string = undefined;

    if (post.image && body.length <= TELEGRAM_CAPTION_LIMIT) {
      try {
        const message = await this.call('sendPhoto', { chat_id, photo: post.image, caption: body, parse_mode: 'HTML' });

        return { messageId: String(message.message_id) };
      } catch (error: any) {
        warning = `Картинка не прикреплена: ${error?.message || error}`;
      }
    }

    const message = await this.call('sendMessage', {
      chat_id,
      text: truncate(body, TELEGRAM_MESSAGE_LIMIT),
      parse_mode: 'HTML',
    });

    return { messageId: String(message.message_id), warning };
  }

  async remove(webhook: Webhook, messageId: string): Promise<void> {
    await this.call('deleteMessage', { chat_id: this.chat(webhook), message_id: Number(messageId) });
  }

  async edit(webhook: Webhook, post: NewsPost, messageId: string): Promise<DeliveryResult> {
    const chat_id = this.chat(webhook);
    const body = this.body(post);
    const message = await this.call(post.image && body.length <= TELEGRAM_CAPTION_LIMIT ? 'editMessageCaption' : 'editMessageText', {
      chat_id,
      message_id: Number(messageId),
      text: truncate(body, TELEGRAM_MESSAGE_LIMIT),
      caption: truncate(body, TELEGRAM_CAPTION_LIMIT),
      parse_mode: 'HTML',
    });

    return { messageId: String(message?.message_id ?? messageId) };
  }
}
