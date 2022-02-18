import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VkLongpollModule } from '../integrations/vk-longpoll/vk-longpoll.module';
import { Webhook } from './entities/webhook.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Webhook]), VkLongpollModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
