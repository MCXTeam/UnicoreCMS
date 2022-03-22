import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Repository } from 'typeorm';
import { Money } from './entities/money.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { UsersService } from 'src/admin/users/users.service';
import { MoneyInput, MoneyTransferType } from './dto/money.input';
import { HistoryService } from '../history/history.service';
import { HistoryType } from '../history/enums/history-type.enum';
import { MoneyExchangeInput, MoneyExchangeType } from './dto/money-exchange.input';
import { ConfigService } from 'src/admin/config/config.service';

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
  ) {}

  private async generate(server: Server, user: User) {
    const money = new Money();
    money.server = server;
    money.money = 0;
    money.user = user;

    return await this.moneyRepository.save(money);
  }

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

  // async update(input: MoneyInput): Promise<Money> {
  //   try {
  //     const money = await this.findOneByUserAndServer(input.server, input.user)
  //     money.money = input.money
  //     return this.moneyRepository.save(money)
  //   } catch {
  //     throw new NotFoundException()
  //   }
  // }

  async transfer(user: User, ip: string, input: MoneyInput): Promise<boolean> {
    if (input.type == MoneyTransferType.Money) {
      try {
        var target_money = await this.findOneByUserAndServer(input.server, input.username);
        var user_money = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      if (user_money.money < input.amount) throw new BadRequestException();

      target_money.money += input.amount;
      user_money.money -= input.amount;

      this.historyService.create(HistoryType.MoneyTransfer, ip, user_money.user, user_money.server, target_money.user, input.amount);

      await this.moneyRepository.save([target_money, user_money]);

      return true;
    } else {
      var target_user = await this.usersService.getByUsername(input.username);

      if (!target_user) throw new NotFoundException();

      if (user.real < input.amount) throw new BadRequestException();

      target_user.real += input.amount;
      user.real -= input.amount;

      this.historyService.create(HistoryType.RealTransfer, ip, user, target_user, input.amount);

      return true;
    }
  }

  async exchange(user: User, ip: string, input: MoneyExchangeInput): Promise<boolean> {
    const cfg = await this.configService.load();

    if (input.type == MoneyExchangeType.Buy) {
      try {
        var user_money = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      const price = input.amount / (cfg.public_economy_rate as number);

      if (user.real < price) throw new BadRequestException();

      user.real -= price;
      user_money.money += input.amount;

      this.historyService.create(HistoryType.MoneyExchange, ip, user_money.user, user_money.server, input.amount);

      await this.moneyRepository.save(user_money);
      await this.usersRepo.save(user);

      return true;
    } else {
      try {
        var user_money_from = await this.findOneByUserAndServer(input.from_server, user);
        var user_money_to = await this.findOneByUserAndServer(input.server, user);
      } catch {
        throw new NotFoundException();
      }

      if (user_money_from.money < input.amount) throw new BadRequestException();

      user_money_from.money -= input.amount;
      user_money_to.money += input.amount;

      this.historyService.create(HistoryType.MoneyServerTransfer, ip, user_money_to.user, user_money_to.server, input.amount);

      await this.moneyRepository.save([user_money_from, user_money_to]);

      return true;
    }
  }
}
