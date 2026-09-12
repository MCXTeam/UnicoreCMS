import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import moment from 'moment';
import { EventsService } from 'src/events/events.service';
import {
  NOTIFICATION_EVENT_NEW,
  NOTIFICATION_EVENT_STATE,
  NOTIFICATION_KEEP_DAYS,
  NOTIFICATION_KEEP_PER_USER,
  NOTIFICATION_CATEGORY_MAX_LENGTH,
  NOTIFICATION_ICON_MAX_LENGTH,
  NOTIFICATION_KEY_MAX_LENGTH,
  NOTIFICATION_LINK_MAX_LENGTH,
  NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_PARAMS_MAX_LENGTH,
  NOTIFICATION_TYPE_MAX_LENGTH,
  NotificationCategoryView,
  NotificationFeed,
  NotificationParams,
  NotificationView,
} from 'unicore-common';
import { NotificationInput } from 'unicore-api';
import { Notification } from './entities/notification.entity';
import { NotificationMute } from './entities/notification-mute.entity';
import { notificationCategories, notificationCategoryExists } from './notification-categories';

const TRIM_BATCH = 1000;

const clamp = (value: string | null | undefined, max: number): string | null =>
  value ? value.slice(0, max) : null;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(NotificationMute) private mutes: Repository<NotificationMute>,
    private eventsService: EventsService,
  ) {}

  async send(uuid: string, input: NotificationInput): Promise<void> {
    await this.sendMany([uuid], input);
  }

  async sendMany(uuids: string[], input: NotificationInput): Promise<void> {
    const targets = [...new Set(uuids.filter(Boolean))];

    if (!targets.length || !input?.type || !input.titleKey) return;

    const muted = await this.mutedUsers(targets, input.category);
    const allowed = targets.filter((uuid) => !muted.has(uuid));

    if (!allowed.length) return;

    const rows = await this.notifications.save(
      allowed.map((uuid) =>
        this.notifications.create({
          user_uuid: uuid,
          type: clamp(input.type, NOTIFICATION_TYPE_MAX_LENGTH),
          category: clamp(input.category, NOTIFICATION_CATEGORY_MAX_LENGTH),
          title_key: clamp(input.titleKey, NOTIFICATION_KEY_MAX_LENGTH),
          body_key: clamp(input.bodyKey, NOTIFICATION_KEY_MAX_LENGTH),
          params: this.fitting(input.params, input.type),
          link: clamp(input.link, NOTIFICATION_LINK_MAX_LENGTH),
          icon: clamp(input.icon, NOTIFICATION_ICON_MAX_LENGTH),
        }),
      ),
    );

    const unread = await this.unreadOf(allowed);

    for (const row of rows) {
      this.eventsService.emitUser(row.user_uuid, NOTIFICATION_EVENT_NEW, this.view(row));

      this.eventsService.emitUser(row.user_uuid, NOTIFICATION_EVENT_STATE, { unread: unread.get(row.user_uuid) ?? 1 });
    }
  }

  private fitting(params: NotificationParams | null | undefined, type: string): NotificationParams | null {
    if (!params) return null;

    if (JSON.stringify(params).length <= NOTIFICATION_PARAMS_MAX_LENGTH) return params;

    this.logger.warn(`Параметры уведомления "${type}" превышают ${NOTIFICATION_PARAMS_MAX_LENGTH} символов и отброшены`);

    return null;
  }

  private async unreadOf(uuids: string[]): Promise<Map<string, number>> {
    if (!uuids.length) return new Map();

    const rows = await this.notifications
      .createQueryBuilder('notification')
      .select('notification.user_uuid', 'uuid')
      .addSelect('COUNT(notification.id)', 'unread')
      .where('notification.user_uuid IN (:...uuids)', { uuids })
      .andWhere('notification.read_at IS NULL')
      .groupBy('notification.user_uuid')
      .getRawMany<{ uuid: string; unread: string }>();

    return new Map(rows.map((row) => [row.uuid, Number(row.unread)]));
  }

  async feed(uuid: string, page = 1, limit = NOTIFICATION_PAGE_SIZE, before?: number): Promise<NotificationFeed> {
    const total = await this.notifications.count({ where: { user_uuid: uuid } });
    const rows = await this.notifications.find({
      where: before ? { user_uuid: uuid, id: LessThan(before) } : { user_uuid: uuid },
      order: { id: 'DESC' },
      skip: before ? 0 : (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map((row) => this.view(row)), unread: await this.unread(uuid), total };
  }

  unread(uuid: string): Promise<number> {
    return this.notifications.count({ where: { user_uuid: uuid, read_at: IsNull() } });
  }

  async markRead(uuid: string, ids?: number[]): Promise<NotificationFeed['unread']> {
    const scope = ids?.length ? { id: In(ids) } : {};

    await this.notifications.update({ user_uuid: uuid, read_at: IsNull(), ...scope }, { read_at: moment().utc().toDate() });

    return this.publishState(uuid);
  }

  async remove(uuid: string, id: number): Promise<NotificationFeed['unread']> {
    await this.notifications.delete({ user_uuid: uuid, id });

    return this.publishState(uuid);
  }

  async clear(uuid: string): Promise<NotificationFeed['unread']> {
    await this.notifications.delete({ user_uuid: uuid });

    return this.publishState(uuid);
  }

  async categories(uuid: string): Promise<NotificationCategoryView[]> {
    const muted = await this.mutes.find({ where: { user_uuid: uuid } });
    const disabled = new Set(muted.map((row) => row.category));

    return notificationCategories().map((category) => ({
      id: category.id,
      labelKey: category.labelKey,
      hintKey: category.hintKey || null,
      icon: category.icon || null,
      moduleId: category.moduleId,
      enabled: !disabled.has(category.id),
    }));
  }

  async setCategory(uuid: string, category: string, enabled: boolean): Promise<NotificationCategoryView[]> {
    if (!notificationCategoryExists(category)) throw new BadRequestException('Неизвестная категория уведомлений');

    if (enabled) await this.mutes.delete({ user_uuid: uuid, category });
    else await this.mutes.upsert({ user_uuid: uuid, category }, ['user_uuid', 'category']);

    return this.categories(uuid);
  }

  async cleanup(): Promise<void> {
    if (NOTIFICATION_KEEP_DAYS > 0)
      await this.notifications.delete({ created: LessThan(moment().utc().subtract(NOTIFICATION_KEEP_DAYS, 'days').toDate()) });

    const heavy = await this.notifications
      .createQueryBuilder('notification')
      .select('notification.user_uuid', 'uuid')
      .groupBy('notification.user_uuid')
      .having('COUNT(notification.id) > :keep', { keep: NOTIFICATION_KEEP_PER_USER })
      .getRawMany<{ uuid: string }>();

    for (const { uuid } of heavy) {
      const stale = await this.notifications.find({
        where: { user_uuid: uuid },
        order: { id: 'DESC' },
        skip: NOTIFICATION_KEEP_PER_USER,
        take: TRIM_BATCH,
        select: ['id'],
      });

      if (stale.length) await this.notifications.delete(stale.map((row) => row.id));
    }
  }

  private async publishState(uuid: string): Promise<number> {
    const unread = await this.unread(uuid);

    this.eventsService.emitUser(uuid, NOTIFICATION_EVENT_STATE, { unread });

    return unread;
  }

  private async mutedUsers(uuids: string[], category: string): Promise<Set<string>> {
    if (!category) return new Set();

    const rows = await this.mutes.find({ where: { user_uuid: In(uuids), category } });

    return new Set(rows.map((row) => row.user_uuid));
  }

  private view(row: Notification): NotificationView {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      titleKey: row.title_key,
      bodyKey: row.body_key,
      params: row.params,
      link: row.link,
      icon: row.icon,
      read: Boolean(row.read_at),
      created: moment(row.created).toISOString(),
    };
  }
}
