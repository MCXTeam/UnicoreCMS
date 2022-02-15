import { Module, OnModuleInit } from '@nestjs/common';
import { VkLongpollService } from './vk-longpoll.service';
import { envConfig } from 'unicore-common';
import { WebhooksModule } from 'src/admin/webhook/webhooks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from 'src/admin/news/entities/news.entity';

@Module({
  imports: [WebhooksModule, TypeOrmModule.forFeature([News])],
  providers: [VkLongpollService],
})
export class VkLongpollModule implements OnModuleInit {
  constructor(private vkLongpollService: VkLongpollService) {}

  async onModuleInit() {
    if (envConfig.vkLongpoll) await this.vkLongpollService.init();
  }
}
