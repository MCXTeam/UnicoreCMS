import { MomentWrapper, StorageManager } from '@common';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { User } from 'src/admin/users/entities/user.entity';
import { EventsService } from 'src/events/events.service';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { Permission } from 'unicore-common';
import { Period } from '../../entities/period.entity';
import { GroupBuyInput } from '../dto/group-buy.input';
import { GroupInput } from '../dto/group.input';
import { DonateGroup } from '../entities/donate-group.entity';
import { GroupKit } from '../entities/group-kit.entity';
import { UsersDonateGroup } from '../entities/user-donate.entity';

@Injectable()
export class DonateGroupsService {
  constructor(
    private eventsService: EventsService,
    private historyService: HistoryService,
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
    const groups = await this.donateGroupsRepository.find({
      relations: ['servers', 'periods'],
      order: {
        price: 'ASC',
      },
      where: (qb) => {
        qb.where('server_id = :id', { id });
      },
    });

    return groups.filter((group) => group.periods.length);
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
    return this.userDonatesRepository.find({ user: { uuid: user.uuid } });
  }

  async buy(user: User, ip: string, input: GroupBuyInput) {
    const group = await this.findOne(input.group, ['servers', 'periods']);
    const server = group?.servers?.find((server) => server.id == input.server);
    const period = group?.periods?.find((period) => period.id == input.period);

    if (!group || !server || !period) throw new NotFoundException();

    const price = (group.price - (group.price * group.sale) / 100) * period.multiplier;

    if (user.real < price) throw new BadRequestException();

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

    user.real = user.real - price;

    await this.historyService.create(HistoryType.DonateGroupPurchase, ip, user, group, server, period);
    await this.userDonatesRepository.save(userDonate);
    await this.usersRepository.save(user);

    // Event!
    this.eventsService.server.to(Permission.KernelUnicoreConnect).emit('buy_donate', userDonate);
  }

  findOne(id: number, relations?: string[]): Promise<DonateGroup> {
    return this.donateGroupsRepository.findOne(id, { relations });
  }

  async create(input: GroupInput) {
    const group = new DonateGroup();

    group.name = input.name;
    group.description = input.description;
    group.price = input.price;
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms;
    group.features = input.features;

    group.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.find({
      id: In(input.kits),
    });

    return this.donateGroupsRepository.save(group);
  }

  async update(id: number, input: GroupInput) {
    const group = await this.findOne(id);

    if (!group) {
      throw new NotFoundException();
    }

    group.name = input.name;
    group.description = input.description;
    group.price = input.price;
    group.sale = input.sale;
    group.ingame_id = input.ingame_id;
    group.web_perms = input.web_perms;
    group.features = input.features;

    group.servers = await this.serversRepository.find({
      id: In(input.servers),
    });

    group.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    group.kits = await this.groupKitsRepository.find({
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

  async updateIcon(id: number, file: MulterFile) {
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
