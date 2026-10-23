import { Module } from '@nestjs/common';
import { ConnectIdentityService } from './connect-identity.service';
import { ConnectPresenceService } from './connect-presence.service';
import { ConnectSessionsService } from './connect-sessions.service';
import { ConnectController } from './connect.controller';
import { GamePunishmentsService } from './game-punishments.service';
import { GamePunishmentsController } from './game-punishments.controller';
import { PunishmentsModule } from '../punishments/punishments.module';

@Module({
  imports: [PunishmentsModule],
  providers: [ConnectIdentityService, ConnectPresenceService, ConnectSessionsService, GamePunishmentsService],
  controllers: [ConnectController, GamePunishmentsController],
  exports: [ConnectPresenceService],
})
export class ConnectModule {}
