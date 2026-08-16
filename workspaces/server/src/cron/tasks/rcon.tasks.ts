import { SafeCron } from '@common';
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { RconQueueService } from 'src/game/servers/rcon/rcon-queue.service';

@Injectable()
export class RconTasks {
  constructor(private rconQueueService: RconQueueService) {}

  @SafeCron(CronExpression.EVERY_5_SECONDS, 'rcon-queue')
  async process() {
    await this.rconQueueService.process();
  }

  @SafeCron(CronExpression.EVERY_DAY_AT_MIDNIGHT, 'rcon-queue-cleanup')
  async clean() {
    await this.rconQueueService.cleanup();
  }
}
