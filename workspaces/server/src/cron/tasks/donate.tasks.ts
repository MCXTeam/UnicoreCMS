import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { EventsService } from 'src/events/events.service';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { PermissionType } from 'src/game/donate/permissions/enums/permission-type.enum';
import { Repository } from 'typeorm';
import { Permission } from 'unicore-common';

@Injectable()
export class DonateTasks {
  constructor(
    @InjectRepository(UsersDonateGroup)
    private udRepository: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission)
    private upRepository: Repository<UsersDonatePermission>,
    private eventsService: EventsService
  ) { }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async clean() {
    const expired = moment().utc().toDate()

    const expiresUD = await this.udRepository.createQueryBuilder("ud")
      .where("ud.expired < :expired", { expired })
      .andWhere("ud.expired != 0", { expired })
      .getMany();

    const expiresUP = await this.upRepository.createQueryBuilder("up")
      .where("up.expired < :expired", { expired })
      .andWhere("up.expired != 0", { expired })
      .getMany();

    (await this.udRepository.remove(expiresUD)).map(udg => {
      this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_group', udg);
    });

    (await this.upRepository.remove(expiresUP)).map(udp => {
      if (udp.permission.type != PermissionType.Web)
        this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_permission', udp);
    })
  }
}
