import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { EventsService } from 'src/events/events.service';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { PermissionType } from 'src/game/donate/permissions/enums/permission-type.enum';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
import { Repository } from 'typeorm';
import { Permission } from 'unicore-common';

@Injectable()
export class DonateTasks {
  constructor(
    @InjectRepository(UsersDonateGroup)
    private udRepository: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission)
    private upRepository: Repository<UsersDonatePermission>,
    private eventsService: EventsService,
    private issuanceService: IssuanceService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async clean() {
    const expired = moment().utc().toDate();

    const expiresUD = await this.udRepository
      .createQueryBuilder('ud')
      .leftJoinAndSelect('ud.user', 'user')
      .leftJoinAndSelect('ud.server', 'server')
      .leftJoinAndSelect('ud.group', 'group')
      .where('ud.expired < :expired', { expired })
      .andWhere('ud.expired != 0', { expired })
      .getMany();

    const expiresUP = await this.upRepository
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .leftJoinAndSelect('up.server', 'server')
      .leftJoinAndSelect('up.permission', 'permission')
      .where('up.expired < :expired', { expired })
      .andWhere('up.expired != 0', { expired })
      .getMany();

    for (const udg of await this.udRepository.remove(expiresUD)) {
      this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_group', udg);

      if (this.issuanceService.isRcon(udg.server)) {
        await this.issuanceService.removeGroup(
          { username: udg.user?.username, uuid: udg.user?.uuid },
          udg.server,
          { ingame_id: udg.group?.ingame_id, name: udg.group?.name },
        );
      }
    }

    for (const udp of await this.upRepository.remove(expiresUP)) {
      if (udp.permission?.type != PermissionType.Web) {
        this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_permission', udp);

        if (this.issuanceService.isRcon(udp.server)) {
          await this.issuanceService.removePermission(
            { username: udp.user?.username, uuid: udp.user?.uuid },
            udp.server,
            { name: udp.permission?.name, perms: udp.permission?.perms },
          );
        }
      }
    }
  }
}
