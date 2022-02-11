import { Module } from '@nestjs/common';
import { DiscordModule } from './discord/discord.module';
import { VkLongpollModule } from './vk-longpoll/vk-longpoll.module';

@Module({
  imports: [DiscordModule, VkLongpollModule]
})
export class IntegrationsModule {}
