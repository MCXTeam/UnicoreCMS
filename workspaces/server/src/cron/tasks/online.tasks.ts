import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from 'src/events/events.service';
import { UpdateOnline } from 'src/game/servers/online/interfaces/update-online.interface';
import { OnlineService } from 'src/game/servers/online/online.service';
import { ServersService } from 'src/game/servers/servers.service';

@Injectable()
export class OnlineTasks {
  private readonly logger = new Logger('OnlineTasks');
  private running = false;

  constructor(private eventsService: EventsService, private onlineService: OnlineService, private serversService: ServersService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async updateOnline() {
    if (this.running) return;
    this.running = true;

    try {
      const servers = await this.serversService.find(['online', 'query', 'instances']);
      const serversUpdated: UpdateOnline[] = await Promise.all(servers.map((server) => this.onlineService.updateOnline(server)));

      if (serversUpdated.find((upd) => upd.updated)) {
        const onlines = await this.onlineService.updateOnlinesRecords();
        this.eventsService.server.to('public').emit('servers/online', onlines);
        this.logger.debug('Online updated');
      }
    } catch (error) {
      this.logger.error(`Online update failed: ${error}`);
    } finally {
      this.running = false;
    }
  }
}
