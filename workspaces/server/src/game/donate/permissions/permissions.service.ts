import { CommonSortInput, debitUserBalance, MomentWrapper } from '@common';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { EventsService } from 'src/events/events.service';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
import { In, Not, Repository } from 'typeorm';
import { Permission } from 'unicore-common';
import { Period } from '../entities/period.entity';
import { GroupKit } from '../groups/entities/group-kit.entity';
import { GiveDonatePermInput } from './dto/give-donate-perm.input';
import { PermissionBuyInput } from './dto/permission-buy.input';
import { PermissionInput } from './dto/permission.input';
import { DonatePermission } from './entities/donate-permission.entity';
import { UsersDonatePermission } from './entities/user-permission.entity';
import { PermissionType } from './enums/permission-type.enum';
import * as _ from 'lodash';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class DonatePermissionsService {
  constructor(
    private configService: ConfigService,
    private eventsService: EventsService,
    private historyService: HistoryService,
    private issuanceService: IssuanceService,
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersDonatePermission)
    private userPermissionsRepository: Repository<UsersDonatePermission>,
    @InjectRepository(DonatePermission)
    private donatePermissionsRepository: Repository<DonatePermission>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) {}

  find(relations: string[] = new Array()): Promise<DonatePermission[]> {
    return this.donatePermissionsRepository.find({ relations });
  }

  me(user: User): Promise<UsersDonatePermission[]> {
    return this.userPermissionsRepository.findBy({ user: { uuid: user.uuid } });
  }

  udpByUUID(uuid: string): Promise<UsersDonatePermission[]> {
    return this.userPermissionsRepository.findBy({ user: { uuid } });
  }

  async give(user: User, server: Server, permission: DonatePermission, period: Period) {
    let userPermission = await this.userPermissionsRepository.findOne({
      where: {
        user: {
          uuid: user.uuid,
        },
        server:
          permission.type == PermissionType.Web
            ? null
            : {
                id: server.id,
              },
        permission: {
          id: permission.id,
        },
      },
      relations: ['user'],
    });

    if (userPermission) {
      if (!userPermission.expired) throw new BadRequestException();

      userPermission.expired = period.expire ? this.moment(userPermission.expired).utc().add(period.expire, 'seconds').toDate() : null;
    } else {
      userPermission = new UsersDonatePermission();
      userPermission.expired = period.expire ? this.moment().utc().add(period.expire, 'seconds').toDate() : null;

      if (permission.type != PermissionType.Web) userPermission.server = server;

      userPermission.permission = permission;
      userPermission.user = user;
    }

    userPermission.user = { uuid: user.uuid } as User;

    const saved = await this.userPermissionsRepository.save(userPermission);

    if (permission.type != PermissionType.Web) {
      if (this.issuanceService.isRcon(server)) {
        await this.issuanceService.deliverPermission(
          { username: user.username, uuid: user.uuid },
          server,
          { name: permission.name, perms: permission.perms },
          period.expire || 0,
        );
      }

      this.eventsService.server?.to(Permission.KernelUnicoreConnect).emit('give_permission', saved);
    }

    return saved;
  }

  async giveByDTO(input: GiveDonatePermInput) {
    var server = null;
    const user = await this.usersRepository.findOneBy({ uuid: input.user_uuid });
    const permission = await this.donatePermissionsRepository.findOneBy({ id: input.permission_id });
    const period = await this.periodsRepository.findOneBy({ id: input.period_id });

    if (input.server_id) {
      server = await this.serversRepository.findOneBy({ id: input.server_id });
      if (!server) throw new NotFoundException();
    }

    if (!user || !permission || !period) throw new NotFoundException();

    if (permission.type != PermissionType.Web && !server) throw new BadRequestException();

    await this.give(user, server, permission, period);
  }

  async take(id: number) {
    const udp = await this.userPermissionsRepository.findOne({ where: { id }, relations: ['user', 'server'] });
    if (!udp) throw new NotFoundException();

    await this.userPermissionsRepository.remove(udp);

    if (udp.permission.type != PermissionType.Web) {
      this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_permission', udp);

      if (this.issuanceService.isRcon(udp.server)) {
        await this.issuanceService.removePermission({ username: udp.user.username, uuid: udp.user.uuid }, udp.server, {
          name: udp.permission.name,
          perms: udp.permission.perms,
        });
      }
    }
  }

  @Transactional()
  async buy(user: User, ip: string, input: PermissionBuyInput) {
    const cfg = await this.configService.load();
    const permission = await this.findOne(input.permission, ['servers', 'periods']);
    const server = permission?.servers?.find((server) => server.id == input.server);
    const period = permission?.periods?.find((period) => period.id == input.period);

    if (!permission || !period || !(server || permission.type == PermissionType.Web)) throw new NotFoundException();

    const price = currencyUtils.roundByType(
      currencyUtils.saleApply(permission.price, permission.sale) * period.multiplier,
      SystemCurrency.REAL,
    );
    let virtual_sale = currencyUtils.roundByType(
      input.use_virtual && cfg[ConfigField.DonatePermsVirtualUse] && permission.virtual_percent !== 0
        ? (price / 100) * (permission.virtual_percent ?? configFieldNumber(cfg, ConfigField.VirtualPercent))
        : 0,
      SystemCurrency.VIRTAUL,
    );

    if (virtual_sale >= user.virtual) virtual_sale = user.virtual;
    const realCost = currencyUtils.roundByType(price - virtual_sale, SystemCurrency.REAL);
    const virtualCost = currencyUtils.roundByType(virtual_sale, SystemCurrency.VIRTAUL);

    await debitUserBalance(this.usersRepository, user.uuid, realCost, virtualCost);

    user.real = currencyUtils.roundByType(user.real - realCost, SystemCurrency.REAL);
    user.virtual = currencyUtils.roundByType(user.virtual - virtualCost, SystemCurrency.VIRTAUL);

    await this.give(user, server, permission, period);
    await this.historyService.create(HistoryType.DonatePermissionPurchase, ip, user, permission, server, period, {
      real: realCost,
      virtual: virtualCost,
    });
  }

  async findByServer(id: string) {
    const perms = (
      await this.donatePermissionsRepository
        .createQueryBuilder('perm')
        .leftJoinAndSelect('perm.periods', 'periods')
        .leftJoinAndSelect('perm.servers', 'servers')
        .leftJoinAndSelect('perm.kits', 'kits')
        .leftJoinAndSelect('kits.images', 'images')
        .leftJoinAndSelect('images.server', 'server')
        .orderBy({ 'perm.priority': 'ASC', 'perm.id': 'ASC' })
        .getMany()
    ).filter((perm) => perm.servers.find((srv) => srv.id == id) || perm.type == PermissionType.Web);

    return _(
      perms
        .filter((group) => group.periods.length)
        .map((perms) =>
          Object.assign(perms, {
            periods: _.orderBy(perms.periods, ['multiplier'], ['asc']),
            kits: _(
              perms.kits.map((kit) =>
                Object.assign(kit, {
                  priority: kit.priority ? kit.priority : 0,
                  images: _(
                    kit.images.map((image) => Object.assign(image, { priority: image.server.priority ? image.server.priority : 0 })),
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

  async findByServerUC(id: string) {
    const perms = (
      await this.donatePermissionsRepository
        .createQueryBuilder('perm')
        .leftJoinAndSelect('perm.periods', 'periods')
        .leftJoinAndSelect('perm.servers', 'servers')
        .leftJoinAndSelect('perm.kits', 'kits')
        .leftJoinAndSelect('kits.images', 'images')
        .leftJoinAndSelect('images.server', 'server')
        .where({ type: Not(PermissionType.Web) })
        .orderBy({ 'perm.priority': 'ASC', 'perm.id': 'ASC' })
        .getMany()
    ).filter((perm) => perm.servers.find((srv) => srv.id == id) || perm.type == PermissionType.Web);

    return perms.filter((perm) => perm.periods.length);
  }

  // For UnicoreConnect
  async findByUserAndServer(server: string, user: string) {
    const permissions = await this.userPermissionsRepository.find({
      where: {
        server: { id: server },
        permission: { type: Not(PermissionType.Web) },
        user: { uuid: user },
      },
      relations: ['user', 'permission'],
    });

    return permissions;
  }

  findOne(id: number, relations?: string[]): Promise<DonatePermission> {
    return this.donatePermissionsRepository.findOne({ where: { id }, relations });
  }

  async sort(input: CommonSortInput) {
    const servers = await this.donatePermissionsRepository.findBy({ id: In(input.items.map((srv) => srv.id)) });

    return this.donatePermissionsRepository.save(
      servers.map((donp) => {
        const updatedSort = input.items.find((dp) => dp.id == donp.id);

        if (updatedSort) return { ...donp, priority: updatedSort.priority };

        return donp;
      }),
    );
  }

  async create(input: PermissionInput) {
    const perm = new DonatePermission();

    perm.name = input.name;
    perm.type = input.type;
    perm.description = input.description;
    perm.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    perm.sale = input.sale;
    perm.virtual_percent = input.virtual_percent;

    perm.periods = await this.periodsRepository.findBy({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.findBy({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.findBy({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.findBy({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async update(id: number, input: PermissionInput) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    perm.name = input.name;
    perm.description = input.description;
    perm.price = currencyUtils.roundByType(input.price, SystemCurrency.REAL);
    perm.sale = input.sale;
    perm.virtual_percent = input.virtual_percent;

    perm.periods = await this.periodsRepository.findBy({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.findBy({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.findBy({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.findBy({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async remove(id: number) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    return this.donatePermissionsRepository.remove(perm);
  }

  async removeMany(ids: number[]) {
    const perms = await this.donatePermissionsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.donatePermissionsRepository.remove(perms);
  }
}
