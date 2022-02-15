import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Webhook])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService]
})
export class WebhooksModule {}
