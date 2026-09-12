import { CronExpression } from '@nestjs/schedule';
import { SafeCron } from '@common';
import { NotificationsService } from 'src/game/cabinet/notifications/notifications.service';

export class NotificationTasks {
  constructor(private notificationsService: NotificationsService) {}

  @SafeCron(CronExpression.EVERY_DAY_AT_4AM, 'notifications-cleanup')
  clean() {
    return this.notificationsService.cleanup();
  }
}
