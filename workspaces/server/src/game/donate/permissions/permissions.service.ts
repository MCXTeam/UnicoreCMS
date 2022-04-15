import { CommonSortInput, MomentWrapper } from '@common';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { EventsService } from 'src/events/events.service';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Server } from 'src/game/servers/entities/server.entity';
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
import * as _ from 'lodash'

@Injectable()
export class DonatePermissionsService {
  constructor(
    private eventsService: EventsService,
    private historyService: HistoryService,
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
  ) { }

  find(relations: string[] = new Array()): Promise<DonatePermission[]> {
    return this.donatePermissionsRepository.find({ relations });
  }

  me(user: User): Promise<UsersDonatePermission[]> {
    return this.userPermissionsRepository.find({ user: { uuid: user.uuid } });
  }

  udpByUUID(uuid: string): Promise<UsersDonatePermission[]> {
    return this.userPermissionsRepository.find({ user: { uuid } });
  }

  async give(user: User, server: Server, permission: DonatePermission, period: Period) {
    let userPermission = await this.userPermissionsRepository.findOne({
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
      }
    }, { relations: ['user']});

    if (userPermission) {
      if (!userPermission.expired) throw new BadRequestException();

      userPermission.expired = period.expire ? this.moment(userPermission.expired).utc().add(period.expire, 'seconds').toDate() : null;
    } else {
      userPermission = new UsersDonatePermission();
      userPermission.expired = period.expire ? this.moment().utc().add(period.expire, 'seconds').toDate() : null;

      if (permission.type != PermissionType.Web)
        userPermission.server = server;

      userPermission.permission = permission;
      userPermission.user = user;
    }

    // Event!
    if (userPermission.permission.type != PermissionType.Web)
      this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('give_permission', userPermission);

    return this.userPermissionsRepository.save(userPermission);
  }

  async giveByDTO(input: GiveDonatePermInput) {
    var server = null;
    const user = await this.usersRepository.findOne({ uuid: input.user_uuid })
    const permission = await this.donatePermissionsRepository.findOne({ id: input.permission_id })
    const period = await this.periodsRepository.findOne({ id: input.period_id })

    if (input.server_id) {
      server = await this.serversRepository.findOne({ id: input.server_id })
      if (!server)
        throw new NotFoundException()
    }

    if (!user || !permission || !period)
      throw new NotFoundException()

    await this.give(user, server, permission, period)
  }

  async take(id: number) {
    const udp = await this.userPermissionsRepository.findOne(id, { relations: ["user"] });
    if (!udp) throw new NotFoundException()

    await this.userPermissionsRepository.remove(udp)

    if (udp.permission.type != PermissionType.Web)
      this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('take_permission', udp);
  }

  async buy(user: User, ip: string, input: PermissionBuyInput) {
    const permission = await this.findOne(input.permission, ['servers', 'periods']);
    const server = permission?.servers?.find((server) => server.id == input.server);
    const period = permission?.periods?.find((period) => period.id == input.period);

    if (!permission || !period || !(server || permission.type == PermissionType.Web)) throw new NotFoundException();

    const price = (permission.price - (permission.price * permission.sale) / 100) * period.multiplier;

    if (user.real < price) throw new BadRequestException();

    user.real = user.real - price;

    await this.give(user, server, permission, period)
    await this.historyService.create(HistoryType.DonatePermissionPurchase, ip, user, permission, server, period);
    await this.usersRepository.save(user);
  }

  async findByServer(id: string) {
    const perms = (await this.donatePermissionsRepository.createQueryBuilder('perm')
      .leftJoinAndSelect('perm.periods', 'periods')
      .leftJoinAndSelect('perm.servers', 'servers')
      .leftJoinAndSelect('perm.kits', 'kits')
      .leftJoinAndSelect('kits.images', 'images')
      .leftJoinAndSelect('images.server', 'server')
      .orderBy({ "perm.priority": "ASC", "perm.id": "ASC" })
      .getMany())
      .filter(perm => perm.servers.find(srv => srv.id == id) || perm.type == PermissionType.Web)

      return _(perms.filter((group) => group.periods.length).map(perms => ({
        ...perms,
        periods: _.orderBy(perms.periods, ["multiplier"], ["asc"]),
        kits: _(perms.kits.map(kit => ({
          ...kit, priority: kit.priority ? kit.priority : 0, 
          images: _(kit.images.map(image => ({...image, priority: image.server.priority ? image.server.priority : 0}))).orderBy(["server.priority", "id"], ["asc", "asc"]).value()
        }))).orderBy(["priority", "id"], ["asc", "asc"]).value()
      }))).orderBy(["priority", "id"], ["asc", "asc"]).value()
  }

  async findByServerUC(id: string) {
    const perms = (await this.donatePermissionsRepository.createQueryBuilder('perm')
      .leftJoinAndSelect('perm.periods', 'periods')
      .leftJoinAndSelect('perm.servers', 'servers')
      .leftJoinAndSelect('perm.kits', 'kits')
      .leftJoinAndSelect('kits.images', 'images')
      .leftJoinAndSelect('images.server', 'server')
      .where({ type: Not(PermissionType.Web) })
      .orderBy({ "perm.priority": "ASC", "perm.id": "ASC" }).getMany()).filter(perm => perm.servers.find(srv => srv.id == id) || perm.type == PermissionType.Web)

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
    return this.donatePermissionsRepository.findOne(id, { relations });
  }

  async sort(input: CommonSortInput) {
    const servers = await this.donatePermissionsRepository.findByIds(input.items.map(srv => srv.id))

    return this.donatePermissionsRepository.save(servers.map(donp => {
      const updatedSort = input.items.find(dp => dp.id == donp.id)

      if (updatedSort) 
        return { ...donp, priority: updatedSort.priority }
      
      return donp
    }))
  }

  async create(input: PermissionInput) {
    const perm = new DonatePermission();

    perm.name = input.name;
    perm.type = input.type;
    perm.description = input.description;
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
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
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
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
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
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
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
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
