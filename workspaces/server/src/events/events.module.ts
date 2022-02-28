import { Global, Module } from '@nestjs/common';
import UsersModule from 'src/admin/users/users.module';
import { WebhooksModule } from 'src/admin/webhook/webhooks.module';
import { AuthModule } from 'src/auth/auth.module';
import { GravitModule } from 'src/auth/gravit/gravit.module';
import { GravitService } from 'src/auth/gravit/gravit.service';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Global()
@Module({
  imports: [OnlineModule, GravitModule],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
