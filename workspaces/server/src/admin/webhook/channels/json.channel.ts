import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { StorageManager, WEBHOOK_TIMEOUT_MS } from '@common';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { Webhook } from '../entities/webhook.entity';
import { DeliveryResult, NewsPost, WebhookChannel } from './channel.interface';

@Injectable()
export class JsonChannel implements WebhookChannel {
  readonly request = WebhookRequestType.JSON;
  readonly format = SocialFormat.PlainText;

  constructor(private httpService: HttpService) {}

  async publish(webhook: Webhook, post: NewsPost): Promise<DeliveryResult> {
    if (!webhook.url) throw new BadRequestException('Не указан адрес вебхука');
    if (!(await StorageManager.isSafeUrl(webhook.url))) throw new BadRequestException('Адрес вебхука недоступен для отправки');

    const response = await firstValueFrom(
      this.httpService.post(webhook.url, post, { timeout: WEBHOOK_TIMEOUT_MS, maxRedirects: 0 }),
    );

    return { code: response.status };
  }
}
