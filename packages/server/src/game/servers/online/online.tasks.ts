
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServersService } from '../servers.service';
import { OnlineService } from './online.service';
import { UpdateOnline } from './interfaces/update-online.interface';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class OnlineTasks {
  private readonly logger = new Logger(OnlineTasks.name);

  constructor (
    private eventsService: EventsService,
    private onlineService: OnlineService,
    private serversService: ServersService
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async updateOnline() {
    const servers = await this.serversService.find(['online', 'query'])
    const serversUpdated: UpdateOnline[] = new Array()
    
    for (var server of servers) {
      const serverInstance = await this.onlineService.updateOnline(server)
      serversUpdated.push(serverInstance)
    }

   if (serversUpdated.find(upd => upd.updated)) {
      const onlines = await this.onlineService.updateOnlinesRecords()
      // Online updated
      // Send events...
      this.eventsService.server.to('public').emit('servers/online', onlines)
      this.logger.debug('Online updated')
   }
  }
}