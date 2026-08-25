import { assertUploadedFile, debitUserBalance, MomentWrapper, NumberSortInput, StorageManager } from '@common';
import { events } from 'unicore-api';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { EventsService } from 'src/events/events.service';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
import { In, Repository } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GiveDonateGroupInput } from '../dto/give-donate-group.input';
import { GroupBuyInput } from '../dto/group-buy.input';
import { GroupInput } from '../dto/group.input';
import { DonateGroup } from '../entities/donate-group.entity';
import { GroupFeature } from '../entities/group-feature.entity';
import { GroupKit } from '../entities/group-kit.entity';
import { UsersDonateGroup } from '../entities/user-donate.entity';
import * as _ from 'lodash';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { runAfterCommit } from 'src/common/utils/transaction';
import { Transactional } from 'typeorm-transactional';

export interface GroupQuote {
  group: DonateGroup;
  server: Server;
  period: Period;
  realCost: number;
  virtualCost: number;
}

@Injectable()
export class DonateGroupsService {
  constructor(
    private configService: ConfigService,
    private eventsService: EventsService,
    private historyService: HistoryService,
    private issuanceService: IssuanceService,
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersDonateGroup)
    private userDonatesRepository: Repository<UsersDonateGroup>,
    @InjectRepository(DonateGroup)
    private donateGroupsRepository: Repository<DonateGroup>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) {}

  find(relations: string[] = new Array()): Promise<DonateGroup[]> {
    return this.donateGroupsRepository.find({ relations });
  }

  async findByServer(id: string) {
    const groups = (
      await this.donateGroupsRepository
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.periods', 'periods')
        .leftJoinAndSelect('group.kits', 'kits')
        .leftJoinAndSelect('kits.images', 'images')
        .leftJoinAndSelect('images.server', 'image_server')
        .leftJoinAndSelect('group.servers', 'servers')
        .leftJoinAndSelect('group.features', 'features')
        .orderBy({ price: 'ASC' })
        .getMany()
    ).filter((perm) => perm.servers.find((srv) => srv.id == id));

    return _(
      groups
        .filter((group) => group.periods.length)
        .map((group) =>
          Object.assign(group, {
            periods: _.orderBy(group.periods, ['multiplier'], ['asc']),
            kits: _(
              group.kits.map((kit) =>
                Object.assign(kit, {
                  priority: kit.priority ? kit.priority : 0,
                  images: _(
                    kit.images
                      .filter((image) => image.server.id == id)
                      .map((image) => Object.assign(image, { priority: image.server.priority ? image.server.priority : 0 })),
                  )
                    .orderBy(['server.priority', 'id'], ['asc', 'asc'])
                    .value(),
                }),
              ),
            )
              .orderBy(['priority', 'id'], ['asc', 'asc'])
              .value(),
          }),
        ),
    )
      .orderBy(['priority', 'id'], ['asc', 'asc'])
      .value();
  }

  async findByUserAndServer(server: string, user: string) {
    const groups = await this.userDonatesRepository.find({
      where: {
        server: { id: server },
        user: { uuid: user },
      },
      relations: ['user'],
    });

    return groups;
  }

  me(user: User): Promise<UsersDonateGroup[]> {
    return this.userDonatesRepository.findBy({ user: { uuid: user.uuid } });
  }

  udgByUUID(uuid: string): Promise<UsersDonateGroup[]> {
    return this.userDonatesRepository.findBy({ user: { uuid } });
  }

  async give(user: User, server: Server, group: DonateGroup, period: Period) {
    let userDonate = await this.userDonatesRepository.findOne({
      where: {
        user: {
          uuid: user.uuid,
        },
        server: {
          id: server.id,
        },
        group: {
          id: group.id,
        },
      },
      relations: ['user'],
    });

    if (userDonate) {
      if (!userDonate.expired) throw new BadRequestException();

      userDonate.expired = period.expire ? this.moment(userDonate.expired).utc().add(period.expire, 'seconds').toDate() : null;
    } else {
      userDonate = new UsersDonateGroup();
      userDonate.expired = period.expire ? this.moment().utc().add(period.expire, 'seconds').toDate() : null;
      userDonate.server = server;
      userDonate.group = group;
      userDonate.user = user;
    }

    userDonate.user = { uuid: user.uuid } as User;

    const saved = await this.userDonatesRepository.save(userDonate);

    if (this.issuanceService.isRcon(server)) {
      await this.issuanceService.deliverGroup(
        { username: user.username, uuid: user.uuid },
        server,
        { ingame_id: group.ingame_id, name: group.name },
        period.expire || 0,
      );
    }

    runAfterCommit(() => this.eventsService.emitKernel('give_group', saved, server?.id));
    runAfterCommit(() =>
      events().emit('donate.group.granted', {
        uuid: user.uuid,
        serverId: Number(server.id),
        groupId: group.id,
        seconds: period.expire || 0,
      }),
    );

    return saved;
  }

  async giveByDTO(input: GiveDonateGroupInput) {
    const user = await this.usersRepository.findOneBy({ uuid: input.user_uuid });
    const server = await this.serversRepository.findOneBy({ id: input.server_id });
    const group = await this.donateGroupsRepository.findOneBy({ id: input.group_id });
    const period = await this.periodsRepository.findOneBy({ id: input.period_id });

    if (!user || !server || !group || !period) throw new NotFoundException();

    await this.give(user, server, group, period);
  }

  async take(id: number) {
    const udg = await this.userDonatesRepository.findOne({ where: { id }, relations: ['user', 'server', 'group'] });
    if (!udg) throw new NotFoundException();

    await this.userDonatesRepository.remove(udg);
    runAfterCommit(() => this.eventsService.emitKernel('take_group', udg, udg.server?.id));
    runAfterCommit(() =>
      events().emit('donate.group.revoked', { uuid: udg.user.uuid, serverId: Number(udg.server.id), groupId: udg.group.id }),
    );

    if (this.issuanceService.isRcon(udg.server)) {
      await this.issuanceService.removeGroup({ username: udg.user.username, uuid: udg.user.uuid }, udg.server, {
        ingame_id: udg.group.ingame_id,
        name: udg.group.name,
      });
    }
  }

  async quote(user: User, input: GroupBuyInput): Promise<GroupQuote> {
    const cfg = await this.configService.load();
    const group = await this.findOne(input.group, ['servers', 'periods']);
    const server = group?.servers?.find((server) => server.id == input.server);
    const period = group?.periods?.find((period) => period.id == input.period);

    if (!group || !server || !period) throw new NotFoundException();

    const price = currencyUtils.roundByType(
      currencyUtils.saleApply(group.price, group.sale) * period.multiplier,
      SystemCurrency.REAL,
    );
    let virtual_sale = currencyUtils.roundByType(
      input.use_virtual && cfg[ConfigField.DonateGroupsVirtualUse] && group.virtual_percent !== 0
        ? (price / 100) * (group.virtual_percent ?? configFieldNumber(cfg, ConfigField.VirtualPercent))
        : 0,
      SystemCurrency.VIRTAUL,
    );

    if (virtual_sale >= user.virtual) virtual_sale = user.virtual;

    return {
      group,
      server,
      period,
      realCost: currencyUtils.roundByType(price - virtual_sale, SystemCurrency.REAL),
      virtualCost: currencyUtils.roundByType(virtual_sale, SystemCurrency.VIRTAUL),
    };
  }

  @Transactional()
  async buy(user: User, ip: string, input: GroupBuyInput) {
    const { group, server, period, realCost, virtualCost } = await this.quote(user, input);

    await debitUserBalance(this.usersRepository, user.uuid, realCost, virtualCost);

    user.real = currencyUtils.roundByType(user.real - realCost, SystemCurrency.REAL);
    user.virtual = currencyUtils.roundByType(user.virtual - virtualCost, SystemCurrency.VIRTAUL);

    await this.give(user, server, group, period);
    await this.historyService.create(HistoryType.DonateGroupPurchase, ip, user, group, server, period, { real: realCost, virtual: virtualCost });
  }

  findOne(id: number, relations?: string[]): Promise<DonateGroup> {
    return this.donateGroupsRepository.findOne({ where: { id }, relations });
  }

  async create(input: GroupInput) {
    const group = new DonateGroup();

    group.name = input.name;
    group.description = input.description;
    group.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms;
    group.features = input.features.map((feature) => Object.assign(new GroupFeature(), feature));
    group.virtual_percent = input.virtual_percent;
    group.giftable = input.giftable !== false;
    group.staff = Boolean(input.staff);
    group.color = input.color ?? null;

    group.servers = await this.serversRepository.findBy({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.findBy({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.findBy({
      id: In(input.kits),
    });

    return this.donateGroupsRepository.save(group);
  }

  async sort(input: NumberSortInput) {
    const servers = await this.donateGroupsRepository.findBy({ id: In(input.items.map((srv) => srv.id)) });

    return this.donateGroupsRepository.save(
      servers.map((dong) => {
        const updatedSort = input.items.find((dg) => dg.id == dong.id);

        if (updatedSort) return { ...dong, priority: updatedSort.priority };

        return dong;
      }),
    );
  }

  async update(id: number, input: GroupInput) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    group.name = input.name;
    group.description = input.description;
    group.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms;
    group.features = input.features.map((feature) => Object.assign(new GroupFeature(), feature));
    group.virtual_percent = input.virtual_percent;
    group.giftable = input.giftable !== false;
    group.staff = Boolean(input.staff);
    group.color = input.color ?? null;

    group.servers = await this.serversRepository.findBy({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.findBy({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.findBy({
      id: In(input.kits),
    });

    return this.donateGroupsRepository.save(group);
  }

  async remove(id: number) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    return this.donateGroupsRepository.remove(group);
  }

  async removeMany(ids: number[]) {
    const groups = await this.donateGroupsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.donateGroupsRepository.remove(groups);
  }

  async updateIcon(id: number, file: Express.Multer.File) {
    assertUploadedFile(file);

    const group = await this.findOne(id);

    if (!group) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(group.icon);
    group.icon = file.filename;

    return this.donateGroupsRepository.save(group);
  }

  async removeIcon(id: number) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    StorageManager.remove(group.icon);
    group.icon = null;

    return this.donateGroupsRepository.save(group);
  }
}
