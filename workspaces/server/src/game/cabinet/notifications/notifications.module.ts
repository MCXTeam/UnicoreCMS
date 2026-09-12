import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { NotificationMute } from './entities/notification-mute.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsSubscriber } from './notifications.subscriber';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationMute, Server, DonateGroup, DonatePermission])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSubscriber],
  exports: [NotificationsService],
})
export class NotificationsModule {}
