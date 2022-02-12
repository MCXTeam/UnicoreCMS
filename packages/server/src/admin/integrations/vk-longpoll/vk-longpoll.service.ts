import { Injectable, Logger } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { VK } from 'vk-io';
import { getById, getPostLink } from './utils';

@Injectable()
export class VkLongpollService {
  private readonly logger = new Logger(VkLongpollService.name);
  protected VK: VK;

  async init() {
    const vk = new VK({
      token: envConfig.vkApiKey,
      apiMode: 'parallel',
    });

    vk.updates.on('wall_post_new', async (context) => {
      const payload = context['payload'];
      const postAuthor = await getById(vk.api, payload.from_id);
      const postLink = await getPostLink(payload);

      console.log(postAuthor);
    });

    await vk.updates
      .start()
      .then(() => this.logger.log(`Connected to VKontakte using LongPoll!`))
      .catch((error) => {
        this.logger.error(`An error occurred when connecting to LongPoll VKontakte!`);
        this.logger.error(error);
      });

    this.VK = vk;
  }
}
