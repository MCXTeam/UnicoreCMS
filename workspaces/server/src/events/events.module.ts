import { Global, Module } from '@nestjs/common';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Global()
@Module({
  imports: [OnlineModule],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
