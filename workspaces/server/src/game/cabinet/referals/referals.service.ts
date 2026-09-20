import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { AuditService } from 'src/common/audit/audit.service';
import { User } from 'src/admin/users/entities/user.entity';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { PlaytimeService } from '../playtime/playtime.service';
import { InviterDto } from './dto/inviter.dto';
import { ReferalDto } from './dto/referals.dto';
import { Referal } from './entities/referal.entity';
import { hooks } from 'unicore-api';
import _ from 'lodash';

const INVITER_CHAIN_LIMIT = 50;

@Injectable()
export class ReferalsService {
  constructor(
    @InjectRepository(Referal) private referalsRepo: Repository<Referal>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(UsersDonateGroup) private userGroupsRepo: Repository<UsersDonateGroup>,
    @InjectRepository(UsersDonatePermission) private userPermissionsRepo: Repository<UsersDonatePermission>,
    private playtimeService: PlaytimeService,
    private configService: ConfigService,
    private auditService: AuditService,
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

  async bindRules(user: User): Promise<{ enabled: boolean; editable: boolean; bound: boolean }> {
    const config = await this.configService.load();
    const enabled = Boolean(config[ConfigField.ReferalBindEnabled]);
    const rebind = Boolean(config[ConfigField.ReferalRebindEnabled]);
    const bound = Boolean(await this.referalsRepo.findOneBy({ userUuid: user.uuid }));

    return { enabled, bound, editable: enabled && (rebind || !bound) };
  }

  async wouldCycle(candidateUuid: string, userUuid: string): Promise<boolean> {
    let current = candidateUuid;

    for (let depth = 0; depth < INVITER_CHAIN_LIMIT; depth += 1) {
      if (current === userUuid) return true;

      const parent = await this.referalsRepo.findOne({ where: { userUuid: current }, relations: ['inviter'] });

      if (!parent?.inviter) return false;

      current = parent.inviter.uuid;
    }

    return true;
  }

  async bindInviter(user: User, code: string, request?: unknown) {
    const rules = await this.bindRules(user);

    if (!rules.enabled) throw new ForbiddenException('Смена пригласившего выключена');
    if (!rules.editable) throw new ForbiddenException('Пригласивший уже указан и менять его нельзя');

    const inviter = await this.usersRepo.findOneBy({ username: code.trim() });

    if (!inviter) throw new NotFoundException('Игрок с таким кодом не найден');
    if (inviter.uuid === user.uuid) throw new BadRequestException('Нельзя указать самого себя');
    if (await this.wouldCycle(inviter.uuid, user.uuid)) throw new BadRequestException('Этот игрок уже приглашён вами');

    const current = await this.referalsRepo.findOne({ where: { userUuid: user.uuid }, relations: ['inviter'] });
    const before = current?.inviter?.username || null;

    const referal = current || new Referal();

    referal.user = user;
    referal.inviter = inviter;

    await this.referalsRepo.save(referal);

    const { actor, ip, client } = this.auditService.context(request);

    this.auditService.record({
      action: 'referal.bind',
      actor,
      ip,
      client,
      target: { type: 'referal', id: user.uuid, name: user.username },
      changes: { inviter: [before, inviter.username] },
    });

    return this.getInviter(user);
  }

  percentEnabled(inviterUuid: string): Promise<boolean> {
    return hooks().allowed('referal.percent', { inviterUuid });
  }

  async paymentPercent(inviter: User): Promise<number> {
    if (!(await this.percentEnabled(inviter.uuid))) return 0;

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

  async paymentReward(user: User, paid: number): Promise<{ inviter: User; amount: number; percent: number } | null> {
    const referal = await this.referalsRepo.findOne({ where: { user: { uuid: user.uuid } }, relations: ['inviter'] });

    if (!referal?.inviter) return null;

    const percent = await this.paymentPercent(referal.inviter);
    const amount = currencyUtils.roundByType((paid * percent) / 100, SystemCurrency.REAL);

    return amount > 0 ? { inviter: referal.inviter, amount, percent } : null;
  }
}
