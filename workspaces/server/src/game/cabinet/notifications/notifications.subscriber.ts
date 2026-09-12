import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { Repository } from 'typeorm';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { events } from 'unicore-api';
import { NOTIFICATION_CATEGORY_DONATE, NOTIFICATION_CATEGORY_PAYMENT } from './notification-categories';
import { NotificationsService } from './notifications.service';

const DONATE_ICON = 'bx bx-crown';
const PAYMENT_ICON = 'bx bx-wallet-alt';
const DONATE_LINK = '/cabinet/donate';
const PAYMENT_LINK = '/cabinet/history';

@Injectable()
export class NotificationsSubscriber implements OnApplicationBootstrap {
  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Server) private servers: Repository<Server>,
    @InjectRepository(DonateGroup) private groups: Repository<DonateGroup>,
    @InjectRepository(DonatePermission) private permissions: Repository<DonatePermission>,
  ) {}

  onApplicationBootstrap(): void {
    events().on('donate.group.granted', async ({ uuid, serverId, groupId, seconds }) => {
      await this.notificationsService.send(uuid, {
        type: 'donate.granted',
        category: NOTIFICATION_CATEGORY_DONATE,
        titleKey: 'notifications.donate_granted',
        bodyKey: seconds > 0 ? 'notifications.donate_granted_until' : 'notifications.donate_granted_forever',
        params: {
          name: await this.groupName(groupId),
          server: await this.serverName(serverId),
          ...(seconds > 0 ? { until: moment().add(seconds, 'seconds').toISOString() } : {}),
        },
        link: DONATE_LINK,
        icon: DONATE_ICON,
      });
    });

    events().on('donate.group.revoked', async ({ uuid, serverId, groupId, reason }) => {
      await this.notificationsService.send(uuid, {
        type: reason === 'expired' ? 'donate.expired' : 'donate.revoked',
        category: NOTIFICATION_CATEGORY_DONATE,
        titleKey: reason === 'expired' ? 'notifications.donate_expired' : 'notifications.donate_revoked',
        bodyKey: 'notifications.donate_target',
        params: { name: await this.groupName(groupId), server: await this.serverName(serverId) },
        link: DONATE_LINK,
        icon: DONATE_ICON,
      });
    });

    events().on('donate.permission.granted', async ({ uuid, serverId, permissionId, seconds }) => {
      await this.notificationsService.send(uuid, {
        type: 'donate.granted',
        category: NOTIFICATION_CATEGORY_DONATE,
        titleKey: 'notifications.permission_granted',
        bodyKey: seconds > 0 ? 'notifications.donate_granted_until' : 'notifications.donate_granted_forever',
        params: {
          name: await this.permissionName(permissionId),
          server: await this.serverName(serverId),
          ...(seconds > 0 ? { until: moment().add(seconds, 'seconds').toISOString() } : {}),
        },
        link: DONATE_LINK,
        icon: DONATE_ICON,
      });
    });

    events().on('donate.permission.revoked', async ({ uuid, serverId, permissionId, reason }) => {
      await this.notificationsService.send(uuid, {
        type: reason === 'expired' ? 'donate.expired' : 'donate.revoked',
        category: NOTIFICATION_CATEGORY_DONATE,
        titleKey: reason === 'expired' ? 'notifications.permission_expired' : 'notifications.permission_revoked',
        bodyKey: 'notifications.donate_target',
        params: { name: await this.permissionName(permissionId), server: await this.serverName(serverId) },
        link: DONATE_LINK,
        icon: DONATE_ICON,
      });
    });

    events().on('payment.paid', async ({ uuid, amount }) => {
      await this.notificationsService.send(uuid, {
        type: 'payment.credited',
        category: NOTIFICATION_CATEGORY_PAYMENT,
        titleKey: 'notifications.payment_credited',
        bodyKey: 'notifications.payment_credited_body',
        params: { real: amount },
        link: PAYMENT_LINK,
        icon: PAYMENT_ICON,
      });
    });
  }

  private async serverName(serverId: string): Promise<string> {
    if (!serverId) return '';

    const server = await this.servers.findOne({ where: { id: serverId } }).catch(() => null);

    return server?.name || serverId;
  }

  private async groupName(groupId: number): Promise<string> {
    const group = await this.groups.findOne({ where: { id: groupId } }).catch(() => null);

    return group?.name || '';
  }

  private async permissionName(permissionId: number): Promise<string> {
    const permission = await this.permissions.findOne({ where: { id: permissionId } }).catch(() => null);

    return permission?.name || '';
  }
}
