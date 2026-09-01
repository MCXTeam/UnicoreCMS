import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { User } from 'src/admin/users/entities/user.entity';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { PlaytimeService } from '../playtime/playtime.service';
import { InviterDto } from './dto/inviter.dto';
import { ReferalDto } from './dto/referals.dto';
import { Referal } from './entities/referal.entity';
import _ from 'lodash';

@Injectable()
export class ReferalsService {
  constructor(
    @InjectRepository(Referal) private referalsRepo: Repository<Referal>,
    @InjectRepository(UsersDonateGroup) private userGroupsRepo: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission) private userPermissionsRepo: Repository<UsersDonatePermission>,
    private playtimeService: PlaytimeService,
    private configService: ConfigService,
  ) {}

  async getInviter(user: User) {
    const inviter = await this.referalsRepo.findOne({ where: { user: { uuid: user.uuid } }, relations: ['user', 'inviter'] });

    return inviter ? new InviterDto(inviter) : null;
  }

  async getReferals(inviter: User) {
    const referals = await this.referalsRepo.find({ where: { inviter: { uuid: inviter.uuid } }, relations: ['user', 'inviter'] });
    const referalsTransform = await Promise.all(
      referals.map(async (ref) =>
        instanceToPlain(
          new ReferalDto({
            ...ref,
            playtime: _.sumBy(await this.playtimeService.findOneByUser(ref.user), (pt) => pt.time),
          }),
        ),
      ),
    );

    return _.orderBy(referalsTransform, ['playtime', 'user.created'], ['desc', 'desc']);
  }

  async paymentPercent(inviter: User): Promise<number> {
    const active = [{ expired: IsNull() }, { expired: MoreThan(new Date()) }];
    const [groups, permissions] = await Promise.all([
      this.userGroupsRepo.find({ where: active.map((expired) => ({ ...expired, user: { uuid: inviter.uuid } })) }),
      this.userPermissionsRepo.find({ where: active.map((expired) => ({ ...expired, user: { uuid: inviter.uuid } })) }),
    ]);
    const base = configFieldNumber(await this.configService.load(), ConfigField.ReferalPaymentPercent);
    const overrides = [
      ...(inviter.roles || []).map((role) => role.referal_percent),
      ...groups.map((row) => row.group?.referal_percent),
      ...permissions.map((row) => row.permission?.referal_percent),
    ].filter((percent) => Number.isFinite(percent) && percent > 0);

    return Math.max(base, ...overrides);
  }

  async paymentReward(user: User, paid: number): Promise<{ inviter: User; amount: number } | null> {
    const referal = await this.referalsRepo.findOne({ where: { user: { uuid: user.uuid } }, relations: ['inviter'] });

    if (!referal?.inviter) return null;

    const percent = await this.paymentPercent(referal.inviter);
    const amount = currencyUtils.roundByType((paid * percent) / 100, SystemCurrency.REAL);

    return amount > 0 ? { inviter: referal.inviter, amount } : null;
  }
}
