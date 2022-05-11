import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Connection, Repository } from 'typeorm';
import { Money } from './entities/money.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { UsersService } from 'src/admin/users/users.service';
import { MoneyInput, MoneyTransferType } from './dto/money.input';
import { HistoryService } from '../history/history.service';
import { HistoryType } from '../history/enums/history-type.enum';
import { MoneyExchangeInput, MoneyExchangeType } from './dto/money-exchange.input';
import { ConfigService } from 'src/admin/config/config.service';
import { MoneyUpdateInput } from './dto/money-update.input';
import { MoneyPayCommandInput } from './dto/money-pay-command.input';
import { MoneyWDInput } from './dto/monet-wd.input';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { ConfigField } from 'src/admin/config/config.enum';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class MoneyService {
  constructor(
    @InjectRepository(Money)
    private moneyRepository: Repository<Money>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private serversService: ServersService,
    private usersService: UsersService,
    private historyService: HistoryService,
    private configService: ConfigService,
  ) { }

  private async generate(server: Server, user: User) {
    const money = new Money();
    money.server = server;
    money.money = 0;
    money.user = user;

    return await this.moneyRepository.save(money);
  }

  @Transactional()
  async findOneByUser(user: User | string): Promise<Money[]> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user);

      if (!user) throw new NotFoundException();
    }

    const servers = await this.serversService.find();
    const money = await this.moneyRepository.find({
      user: {
        uuid: user.uuid,
      },
    });

    return Promise.all(
      servers.map(async (server) => {
        const finder = money.find((m) => m.server.id == server.id);
        if (finder) return finder;
        else return await this.generate(server, user as User);
      }),
    );
  }

  @Transactional()
  async findOneByUserAndServer(server_id: string, user: string | User): Promise<Money> {
    if (typeof user === 'string') user = await this.usersService.getByUsername(user);

    const server = await this.serversService.findOne(server_id);

    if (!user || !server || !server_id) throw new NotFoundException();

    const money = await this.moneyRepository.findOne({ user, server }, { relations: ['user', 'server'] });

    if (money) return money;
    else {
      return this.generate(server, user as User);
    }
  }

  @Transactional()
  async findOneByUserUuidAndServer(server_id: string, user: string | User): Promise<Money> {
    if (typeof user === 'string') user = await this.usersService.getById(user);

    const server = await this.serversService.findOne(server_id);

    if (!user || !server || !server_id) throw new NotFoundException();

    const money = await this.moneyRepository.findOne({ user, server }, { relations: ['user', 'server'] });

    if (money) return money;
    else {
      return this.generate(server, user as User);
    }
  }

  @Transactional()
  async findTopByServer(id: string): Promise<Money[]> {
    return this.moneyRepository.find({
      where: {
        server: { id }
      },
      order: {
        money: "DESC"
      },
      relations: ["server", "user"],
      take: 10
    })
  }

  @Transactional()
  async update(input: MoneyUpdateInput) {
    const user = await this.usersRepo.findOne(input.uuid)
    if (!user) throw new NotFoundException();

    if (input.type == MoneyTransferType.Money) {
      try {
        var user_money = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      user_money.money = currencyUtils.roundByType(input.amount, SystemCurrency.INGAME);
      await this.moneyRepository.save(user_money);

      return true;
    } else {
      user.real = currencyUtils.roundByType(input.amount, SystemCurrency.REAL);
      await this.usersRepo.save(user);
      return true;
    }
  }

  @Transactional()
  async payCommand(input: MoneyPayCommandInput) {
    if (input.target_uuid == input.user_uuid)
      throw new BadRequestException();

    try {
      var target_money = await this.findOneByUserUuidAndServer(input.server_id, input.target_uuid);
      var user_money = await this.findOneByUserUuidAndServer(input.server_id, input.user_uuid);
    } catch {
      throw new NotFoundException();
    }

    if (user_money.money < input.amount) throw new BadRequestException();

    await this.moneyRepository.decrement({ user: { uuid: input.user_uuid }, server: { id: input.server_id } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
    await this.moneyRepository.increment({ user: { uuid: input.target_uuid }, server: { id: input.server_id } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
    await this.historyService.create(HistoryType.MoneyTransfer, input.user_ip, user_money.user, user_money.server, target_money.user, input.amount);

    return  this.findOneByUserUuidAndServer(input.server_id, input.user_uuid);
  }

  @Transactional()
  async deposit(input: MoneyWDInput) {
    try {
      var user_money = await this.findOneByUserUuidAndServer(input.server_id, input.user_uuid);
    } catch {
      throw new NotFoundException();
    }

    user_money.money += input.amount;

    return true;
  }

  @Transactional()
  async withdraw(input: MoneyWDInput) {
    try {
      var user_money = await this.findOneByUserUuidAndServer(input.server_id, input.user_uuid);
    } catch {
      throw new NotFoundException();
    }

    if (user_money.money < input.amount) throw new BadRequestException();

    await this.moneyRepository.decrement({ user: { uuid: input.user_uuid }, server: { id: input.server_id } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))

    return true;
  }

  @Transactional()
  async transfer(user: User, ip: string, input: MoneyInput): Promise<boolean> {
    if (user.username == input.username)
      throw new BadRequestException();

    if (input.type == MoneyTransferType.Money) {
      try {
        var target_money = await this.findOneByUserAndServer(input.server, input.username);
        var user_money = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      if (currencyUtils.roundByType(user_money.money, SystemCurrency.INGAME) < currencyUtils.roundByType(input.amount, SystemCurrency.INGAME)) throw new BadRequestException();

      await this.moneyRepository.decrement({ user: { uuid: user.uuid }, server: { id: input.server } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
      await this.moneyRepository.increment({ user: { uuid: user.uuid }, server: { id: input.server } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
      await this.historyService.create(HistoryType.MoneyTransfer, ip, user_money.user, user_money.server, target_money.user, currencyUtils.roundByType(input.amount, SystemCurrency.INGAME));

      return true;
    } else {
      var target_user = await this.usersService.getByUsername(input.username);

      if (!target_user) throw new NotFoundException();

      if (currencyUtils.roundByType(user.real, SystemCurrency.REAL) < currencyUtils.roundByType(input.amount, SystemCurrency.REAL)) throw new BadRequestException();

      await this.usersRepo.increment({ uuid: target_user.uuid }, "real", currencyUtils.roundByType(input.amount, SystemCurrency.REAL))
      await this.usersRepo.decrement({ uuid: user.uuid }, "real", currencyUtils.roundByType(input.amount, SystemCurrency.REAL))
      await this.historyService.create(HistoryType.RealTransfer, ip, user, target_user, input.amount);

      return true;
    }
  }

  @Transactional()
  async exchange(user: User, ip: string, input: MoneyExchangeInput): Promise<boolean> {
    const cfg = await this.configService.load();

    if (input.type == MoneyExchangeType.Buy) {
      try {
        var user_money = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      const price = currencyUtils.roundByType(input.amount / (cfg[ConfigField.EconomyRate] as number), SystemCurrency.REAL);

      if (user.real < price) throw new BadRequestException();

      await this.usersRepo.decrement({ uuid: user.uuid }, "real", currencyUtils.roundByType(price, SystemCurrency.REAL))
      await this.moneyRepository.increment({ user: { uuid: user.uuid }, server: { id: input.server } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
      await this.historyService.create(HistoryType.MoneyExchange, ip, user_money.user, user_money.server, currencyUtils.roundByType(input.amount, SystemCurrency.INGAME));

      return true;
    } else {
      try {
        var user_money_from = await this.findOneByUserAndServer(input.from_server, user);
        var user_money_to = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      if (currencyUtils.roundByType(user_money_from.money, SystemCurrency.INGAME) < currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
        throw new BadRequestException();

      await this.moneyRepository.decrement({ user: { uuid: user.uuid }, server: { id: input.server } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
      await this.moneyRepository.increment({ user: { uuid: user.uuid }, server: { id: input.server } }, "money", currencyUtils.roundByType(input.amount, SystemCurrency.INGAME))
      await this.historyService.create(HistoryType.MoneyServerTransfer, ip, user_money_to.user, user_money_to.server, currencyUtils.roundByType(input.amount, SystemCurrency.INGAME));

      return true;
    }
  }
}
