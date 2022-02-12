import { Module, OnModuleInit } from '@nestjs/common';
import { VkLongpollService } from './vk-longpoll.service';
import { envConfig } from 'unicore-common';

@Module({
  providers: [VkLongpollService],
})
export class VkLongpollModule implements OnModuleInit {
  constructor(private vkLongpollService: VkLongpollService) {}

  async onModuleInit() {
    if (envConfig.vkLongpoll) await this.vkLongpollService.init();
  }
}
