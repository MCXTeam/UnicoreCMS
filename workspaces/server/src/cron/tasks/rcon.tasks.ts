import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RconQueueService } from 'src/game/servers/rcon/rcon-queue.service';

@Injectable()
export class RconTasks {
  constructor(private rconQueueService: RconQueueService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async process() {
    await this.rconQueueService.process();
  }
}
