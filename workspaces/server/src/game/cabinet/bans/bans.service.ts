import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { runAfterCommit } from 'src/common/utils/transaction';
import { events } from 'unicore-api';
import { InjectRepository } from '@nestjs/typeorm';
import { userPermissionCheck, UsersService } from 'src/admin/users/users.service';
import { Repository } from 'typeorm';
import { BanInput } from './dto/ban.input';
import { Ban } from './entities/ban.entity';
import * as moment from 'moment';
import { User } from 'src/admin/users/entities/user.entity';
import { BanFromAdminInput } from './dto/ban-from-admin.input';
import { debitUserBalance, MomentWrapper } from '@common';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { HistoryService } from '../history/history.service';
import { HistoryType } from '../history/enums/history-type.enum';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class BansService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private configService: ConfigService,
    private historyService: HistoryService,
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

    const saved = await this.bansRepository.save(ban);

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

    return this.bansRepository.save(ban);
  }

  @Transactional()
  async unban(user: User, ip: string) {
    if (!user.ban) throw new NotFoundException();

    const config = await this.configService.load();
    const price = currencyUtils.roundByType(configFieldNumber(config, ConfigField.UnbanPrice), SystemCurrency.REAL);

    await debitUserBalance(this.usersRepository, user.uuid, price);

    await this.bansRepository.delete({ user: { uuid: user.uuid } });
    await this.historyService.create(HistoryType.UnabnPurchase, ip, user, { real: price, virtual: 0 });

    runAfterCommit(() => events().emit('user.unbanned', { uuid: user.uuid, username: user.username }));

    return true;
  }

  async remove(uuid: string): Promise<void> {
    const ban = await this.bansRepository.findOne({ where: { user: { uuid } }, relations: ['user'] });

    await this.bansRepository.delete({ user: { uuid: uuid } });

    if (ban) await events().emit('user.unbanned', { uuid, username: ban.user?.username || '' });
  }
}
