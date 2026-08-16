import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from '../news/entities/news.entity';
import { VkLongpollModule } from '../integrations/vk-longpoll/vk-longpoll.module';
import { DiscordChannel } from './channels/discord.channel';
import { JsonChannel } from './channels/json.channel';
import { TelegramChannel } from './channels/telegram.channel';
import { VkChannel } from './channels/vk.channel';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { Webhook } from './entities/webhook.entity';
import { WebhookDeliveriesService } from './webhook-deliveries.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Webhook, WebhookDelivery, News]), forwardRef(() => VkLongpollModule)],
  providers: [WebhooksService, WebhookDeliveriesService, DiscordChannel, TelegramChannel, VkChannel, JsonChannel],
  controllers: [WebhooksController],
  exports: [WebhooksService, WebhookDeliveriesService],
})
export class WebhooksModule {}
