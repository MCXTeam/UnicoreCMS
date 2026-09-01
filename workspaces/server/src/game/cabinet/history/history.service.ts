import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { MoreThan, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PaginatedHistoryDto } from './dto/history.dto';
import { History } from './entities/history.entity';
import { HistoryType } from './enums/history-type.enum';

export interface PurchaseCost {
  real: number;
  virtual: number;
}

function applyCost(history: History, cost?: PurchaseCost) {
  if (!cost) return;

  history.real_spent = cost.real;
  history.virtual_spent = cost.virtual;
}

export interface GiftHistoryInput {
  type: HistoryType.GiftPurchase | HistoryType.GiftReceived;
  ip: string;
  user: User;
  target?: User;
  server?: Server;
  period?: Period;
  product?: Product;
  kit?: Kit;
  donateGroup?: DonateGroup;
  donatePermission?: DonatePermission;
  amount?: number;
  cost?: PurchaseCost;
}

@Injectable()
export class HistoryService {
  constructor(@InjectRepository(History) private historyRepository: Repository<History>, private usersService: UsersService) {}

  async findByUUID(query: PaginateQuery, uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return this.find(query, user);
  }

  async find(query: PaginateQuery, user: User) {
    const qb = this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.product', 'product')
      .leftJoinAndSelect('history.kit', 'kit')
      .leftJoinAndSelect('history.server', 'server')
      .leftJoinAndSelect('history.donate_group', 'donate_group')
      .leftJoinAndSelect('history.donate_permission', 'donate_permission')
      .leftJoinAndSelect('history.period', 'period')
      .leftJoinAndSelect('history.payment', 'payment')
      .leftJoinAndSelect('history.target', 'target')
      .leftJoinAndSelect('target.skin', 'skin')
      .leftJoinAndSelect('target.cloak', 'cloak')
      .where({ user });

    return new PaginatedHistoryDto(
      await paginate(query, qb, {
        sortableColumns: ['created'],
        searchableColumns: ['created'],
        defaultSortBy: [['created', 'DESC']],
        filterableColumns: {
          type: [FilterOperator.EQ],
        },
        maxLimit: 25,
      }),
    );
  }

  countGifts(user: User, since: Date): Promise<number> {
    return this.historyRepository.count({
      where: { user: { uuid: user.uuid }, type: HistoryType.GiftPurchase, created: MoreThan(since) },
    });
  }

  @Transactional()
  gift(input: GiftHistoryInput) {
    const history = new History();

    history.user = input.user;
    history.type = input.type;
    history.ip = input.ip;
    history.target = input.target;
    history.server = input.server;
    history.period = input.period;
    history.product = input.product;
    history.kit = input.kit;
    history.donate_group = input.donateGroup;
    history.donate_permission = input.donatePermission;
    history.amount = input.amount;

    applyCost(history, input.cost);

    return this.historyRepository.insert(history);
  }

  create(type: HistoryType.ProductPurchase, ip: string, user: User, product: Product, server: Server, amount: number, cost?: PurchaseCost);
  create(type: HistoryType.KitPurchase, ip: string, user: User, product: Kit, server: Server, cost?: PurchaseCost);
  create(
    type: HistoryType.DonateGroupPurchase,
    ip: string,
    user: User,
    donateGroup: DonateGroup,
    server: Server,
    period: Period,
    cost?: PurchaseCost,
  );
  create(
    type: HistoryType.DonatePermissionPurchase,
    ip: string,
    user: User,
    donatePermission: DonatePermission,
    server: Server,
    period: Period,
    cost?: PurchaseCost,
  );
  create(type: HistoryType.UnabnPurchase, ip: string, user: User, cost: PurchaseCost);
  create(type: HistoryType.Payment, ip: string, user: User, payment: Payment);
  create(type: HistoryType.ReferalReward, ip: string, user: User, target: User, payment: Payment, amount: number);
  create(type: HistoryType.MoneyServerTransfer, ip: string, user: User, server: Server, amount: number);
  create(type: HistoryType.MoneyExchange, ip: string, user: User, server: Server, amount: number);
  create(type: HistoryType.RealTransfer, ip: string, user: User, target: User, amount: number);
  create(type: HistoryType.MoneyTransfer, ip: string, user: User, server: Server, target: User, amount: number);
  @Transactional()
  create(type: HistoryType, ip: string, user: User, payload?: any, secondPayload?: any, thirdPayload?: any, fourthPayload?: any) {
    const history = new History();
    history.user = user;
    history.type = type;
    history.ip = ip;

    switch (type) {
      case HistoryType.ProductPurchase:
        history.product = payload;
        history.server = secondPayload;
        history.amount = thirdPayload;
        applyCost(history, fourthPayload);

        return this.historyRepository.insert(history);
      case HistoryType.KitPurchase:
        history.kit = payload;
        history.server = secondPayload;
        applyCost(history, thirdPayload);

        return this.historyRepository.insert(history);
      case HistoryType.DonateGroupPurchase:
        history.donate_group = payload;
        history.server = secondPayload;
        history.period = thirdPayload;
        applyCost(history, fourthPayload);

        return this.historyRepository.insert(history);
      case HistoryType.DonatePermissionPurchase:
        history.donate_permission = payload;
        history.server = secondPayload;
        history.period = thirdPayload;
        applyCost(history, fourthPayload);

        return this.historyRepository.insert(history);
      case HistoryType.UnabnPurchase:
        applyCost(history, payload);

        return this.historyRepository.insert(history);
      case HistoryType.Payment:
        history.payment = payload;

        return this.historyRepository.insert(history);
      case HistoryType.ReferalReward:
        history.target = payload;
        history.payment = secondPayload;
        history.amount = thirdPayload;

        return this.historyRepository.insert(history);
      case HistoryType.RealTransfer:
        history.target = payload;
        history.amount = secondPayload;

        return this.historyRepository.insert(history);
      case HistoryType.MoneyTransfer:
        history.server = payload;
        history.target = secondPayload;
        history.amount = thirdPayload;

        return this.historyRepository.insert(history);
      case HistoryType.MoneyServerTransfer:
        history.server = payload;
        history.amount = secondPayload;

        return this.historyRepository.insert(history);

      case HistoryType.MoneyExchange:
        history.server = payload;
        history.amount = secondPayload;

        return this.historyRepository.insert(history);
    }
  }
}
