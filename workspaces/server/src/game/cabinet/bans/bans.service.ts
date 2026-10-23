import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { events } from 'unicore-api';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/admin/users/users.service';
import { userPermissionCheck } from 'src/admin/roles/grant';
import { Repository } from 'typeorm';
import { BanInput } from './dto/ban.input';
import { Ban } from './entities/ban.entity';
import moment from 'moment';
import { User } from 'src/admin/users/entities/user.entity';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { MomentWrapper } from '@common';
import { AccountRestrictionsService } from '../../punishments/account-restrictions.service';
import { PunishmentPurchasesService } from '../../punishments/punishment-purchases.service';

@Injectable()
export class BansService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    private usersService: UsersService,
    private accountRestrictions: AccountRestrictionsService,
    private punishmentPurchases: PunishmentPurchasesService,
  ) {}

  findOne(uuid: string): Promise<Ban> {
    return this.bansRepository.findOne({
      where: { user: { uuid } },
      relations: ['user', 'actor'],
    });
  }

  async create(kernel: User, input: BanInput): Promise<Ban> {
    var ban = await this.bansRepository.findOne({ where: { user: { uuid: input.user_uuid } }, relations: ['user'] });

    if (!ban) ban = new Ban();

    ban.reason = input.reason;
    ban.user = await this.usersService.getById(input.user_uuid);

    if (input.actor_uuid) {
      ban.actor = await this.usersService.getById(input.actor_uuid);
    } else {
      ban.actor = kernel;
    }

    if (input.expires) ban.expires = moment.unix(input.expires).toDate();
    else ban.expires = null;

    if (!ban.user || !ban.actor || ban.user.uuid == kernel.uuid) throw new BadRequestException();

    const saved = await this.accountRestrictions.save(ban);

    await events().emit('user.banned', {
      uuid: saved.user.uuid,
      username: saved.user.username,
      reason: saved.reason,
      until: saved.expires,
    });

    return saved;
  }

  async createFromAdmin(actor: User, input: BanFromAdminInput) {
    var ban = await this.bansRepository.findOne({ where: { user: { uuid: input.user_uuid } }, relations: ['user'] });
    const kernel = await this.usersService.getKernel();

    if (!ban) ban = new Ban();

    ban.reason = input.reason;
    ban.actor = actor;
    ban.user = await this.usersService.getById(input.user_uuid);

    if (input.expires) ban.expires = this.moment(input.expires).utc().toDate();
    else ban.expires = null;

    if (!ban.user || !ban.actor || ban.user.uuid == kernel.uuid) throw new BadRequestException();

    if (!(await userPermissionCheck(ban.user, actor))) throw new ForbiddenException();

    return this.accountRestrictions.save(ban);
  }

  async unban(user: User, ip: string) {
    await this.punishmentPurchases.buyAccount(user, ip);
    await events().emit('user.unbanned', { uuid: user.uuid, username: user.username });
    return true;
  }

  async remove(uuid: string, actor?: User): Promise<void> {
    const ban = await this.bansRepository.findOne({ where: { user: { uuid } }, relations: ['user'] });

    if (ban && actor && !(await userPermissionCheck(ban.user, actor))) throw new ForbiddenException();
    await this.accountRestrictions.remove(uuid, actor?.uuid || null);

    if (ban) await events().emit('user.unbanned', { uuid, username: ban.user?.username || '' });
  }
}
