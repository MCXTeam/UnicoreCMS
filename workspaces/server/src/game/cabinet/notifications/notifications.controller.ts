import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { NOTIFICATION_PAGE_SIZE } from 'unicore-common';
import { NotificationFeedQuery } from './dto/notification-feed.query';
import { NotificationReadInput } from './dto/notification-read.input';
import { NotificationSettingInput } from './dto/notification-setting.input';
import { NotificationsService } from './notifications.service';

@Controller('cabinet/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  feed(@CurrentUser() user: User, @Query() query: NotificationFeedQuery) {
    return this.notificationsService.feed(user.uuid, query.page || 1, query.limit || NOTIFICATION_PAGE_SIZE, query.before);
  }

  @Get('settings')
  settings(@CurrentUser() user: User) {
    return this.notificationsService.categories(user.uuid);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: User, @Body() body: NotificationSettingInput) {
    return this.notificationsService.setCategory(user.uuid, body.category, body.enabled);
  }

  @Post('read')
  async read(@CurrentUser() user: User, @Body() body: NotificationReadInput) {
    return { unread: await this.notificationsService.markRead(user.uuid, body.ids) };
  }

  @Delete()
  async clear(@CurrentUser() user: User) {
    return { unread: await this.notificationsService.clear(user.uuid) };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return { unread: await this.notificationsService.remove(user.uuid, id) };
  }
}
