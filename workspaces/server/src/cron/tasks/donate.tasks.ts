import { SafeCron } from '@common';
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { EventsService } from 'src/events/events.service';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { PermissionType } from 'src/game/donate/permissions/enums/permission-type.enum';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
import { DonateWebRoleService } from 'src/game/donate/web-role.service';
import { Repository } from 'typeorm';
import { events } from 'unicore-api';
import { Transactional } from 'typeorm-transactional';
import { runAfterCommit } from 'src/common/utils/transaction';

@Injectable()
export class DonateTasks {
  constructor(
    @InjectRepository(UsersDonateGroup)
    private udRepository: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission)
    private upRepository: Repository<UsersDonatePermission>,
    private eventsService: EventsService,
    private issuanceService: IssuanceService,
    private webRoles: DonateWebRoleService,
  ) {}

  @SafeCron(CronExpression.EVERY_10_MINUTES, 'donate-expire')
  async clean() {
    const expired = moment().utc().toDate();

    const expiresUD = await this.udRepository
      .createQueryBuilder('ud')
      .leftJoinAndSelect('ud.user', 'user')
      .leftJoinAndSelect('ud.server', 'server')
      .leftJoinAndSelect('ud.group', 'group')
      .where('ud.expired IS NOT NULL')
      .andWhere('ud.expired < :expired', { expired })
      .getMany();

    const expiresUP = await this.upRepository
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .leftJoinAndSelect('up.server', 'server')
      .leftJoinAndSelect('up.permission', 'permission')
      .where('up.expired IS NOT NULL')
      .andWhere('up.expired < :expired', { expired })
      .getMany();

    for (const candidate of expiresUD) await this.expireGroup(candidate.id, expired);
    for (const candidate of expiresUP) await this.expirePermission(candidate.id, expired);
  }

  @Transactional()
  private async expireGroup(id: number, expired: Date) {
    const udg = await this.webRoles.expireGroup(id, expired);

    if (!udg) return;

    if (udg.user?.uuid && udg.group?.id)
      runAfterCommit(() =>
        events().emit('donate.group.revoked', {
          uuid: udg.user.uuid,
          serverId: String(udg.server?.id ?? ''),
          groupId: udg.group.id,
          reason: 'expired',
        }),
      );

    runAfterCommit(() => this.eventsService.emitKernel('take_group', udg, udg.server?.id));

    if (this.issuanceService.isRcon(udg.server)) {
      await this.issuanceService.removeGroup({ username: udg.user?.username, uuid: udg.user?.uuid }, udg.server, {
        ingame_id: udg.group?.ingame_id,
        name: udg.group?.name,
      });
    }
  }

  @Transactional()
  private async expirePermission(id: number, expired: Date) {
    const udp = await this.webRoles.expirePermission(id, expired);

    if (!udp) return;

    if (udp.user?.uuid && udp.permission?.id)
      runAfterCommit(() =>
        events().emit('donate.permission.revoked', {
          uuid: udp.user.uuid,
          serverId: String(udp.server?.id ?? ''),
          permissionId: udp.permission.id,
          reason: 'expired',
        }),
      );

    if (udp.permission?.type != PermissionType.Web) {
      runAfterCommit(() => this.eventsService.emitKernel('take_permission', udp, udp.server?.id));

      if (this.issuanceService.isRcon(udp.server)) {
        await this.issuanceService.removePermission({ username: udp.user?.username, uuid: udp.user?.uuid }, udp.server, {
          name: udp.permission?.name,
          perms: udp.permission?.perms,
        });
      }
    }
  }
}
