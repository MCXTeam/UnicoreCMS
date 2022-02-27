import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Repository } from 'typeorm';
import { Money } from './entities/money.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { UsersService } from 'src/admin/users/users.service';
import { MoneyInput } from './dto/money.input';
import { MoneyTransferDto } from './dto/money-transfer.dto';
import { HistoryService } from '../history/history.service';
import { HistoryType } from '../history/enums/history-type.enum';

@Injectable()
export class MoneyService {
  constructor(
    @InjectRepository(Money)
    private moneyRepository: Repository<Money>,
    private serversService: ServersService,
    private usersService: UsersService,
    private historyService: HistoryService
  ) { }

  private async generate(server: Server, user: User) {
    const money = new Money()
    money.server = server
    money.money = 0
    money.user = user

    return await this.moneyRepository.save(money)
  }

  async findOneByUser(user: User | string): Promise<Money[]> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user)

      if (!user)
        throw new NotFoundException()
    }

    const servers = await this.serversService.find()
    const money = await this.moneyRepository.find({
      user: {
        uuid: user.uuid
      }
    })

    return Promise.all(servers.map(async server => {
      const finder = money.find(m => m.server.id == server.id)
      if (finder) return finder
      else return await this.generate(server, user as User)
    }))
  }

  async findOneByUserAndServer(server_id: string, user: string | User): Promise<Money> {
    if (typeof user === 'string') {
      user = await this.usersService.getById(user)

      if (!user)
        throw new NotFoundException()
    }

    if (!user)
      throw new NotFoundException()

    const money = await this.moneyRepository.findOne({
      user: {
        uuid: user.uuid
      },
      server: {
        id: server_id
      }
    }, { relations: ['user', 'server'] })

    if (money)
      return money
    else {
      const server = await this.serversService.findOne(server_id)

      if (!server)
        throw new NotFoundException()

      return this.generate(server, user as User)
    }
  }

  async update(input: MoneyInput): Promise<Money> {
    try {
      const money = await this.findOneByUserAndServer(input.server, input.user)
      money.money = input.money
      return this.moneyRepository.save(money)
    } catch {
      throw new NotFoundException()
    }
  }

  async transfer(user: User, ip: string, input: MoneyInput): Promise<MoneyTransferDto> {
    try {
      var target_money = await this.findOneByUserAndServer(input.server, input.user)
      var user_money = await this.findOneByUserAndServer(input.server, user)
    } catch {
      throw new NotFoundException()
    }

    if (user_money.money < input.money)
      throw new BadRequestException()

    target_money.money = target_money.money + input.money
    user_money.money = user_money.money + input.money

    this.historyService.create(HistoryType.MoneyTransfer, ip, user_money.user, user_money.server, target_money.user, input.money)

    return new MoneyTransferDto({
      data: await this.moneyRepository.save([user_money, target_money])
    })
  }
}
