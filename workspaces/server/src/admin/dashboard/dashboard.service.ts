import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import _ from 'lodash';
import { User } from '../users/entities/user.entity';
import { StatGroup } from './interfaces/stat.interface';
import { StatType } from './enums/stat-type.enum';
import { DASHBOARD_MONTH_DAYS, DASHBOARD_WEEK_DAYS, KERNEL_USERNAME, MomentWrapper } from '@common';
import { DashboardStatSection, DASHBOARD_STAT_SECTIONS } from 'unicore-common';
import { OnlinesRecord } from 'src/game/servers/online/entities/onlines-record.entity';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { HistoryGroupType, HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { RevenueQuery, RevenueReport, RevenueRow } from './dto/revenue.dto';
import { RevenueItem } from './dto/revenue.dto';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentStatuses } from 'src/payment/enums/payment-statuses.enum';
import { StatsInterface } from './interfaces/stats.inteface';
import { OnlineService } from 'src/game/servers/online/online.service';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(OnlinesRecord)
    private onlinesRecordsRepository: Repository<OnlinesRecord>,
    @InjectRepository(History)
    private historyRepository: Repository<History>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private onlineService: OnlineService,
  ) {}

  async revenueItems(query: RevenueQuery, allowed: string[] | null = null): Promise<RevenueItem[]> {
    const from = query.from
      ? this.moment(query.from).utc().startOf('day')
      : this.moment()
          .utc()
          .subtract(DASHBOARD_MONTH_DAYS - 1, 'day')
          .startOf('day');
    const to = query.to ? this.moment(query.to).utc().endOf('day') : this.moment().utc().endOf('day');

    const rows = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoin('history.product', 'product')
      .leftJoin('history.kit', 'kit')
      .leftJoin('history.donate_group', 'donateGroup')
      .leftJoin('history.donate_permission', 'donatePermission')
      .leftJoin('history.server', 'server')
      .select('COALESCE(product.name, kit.name, donateGroup.name, donatePermission.name)', 'name')
      .addSelect('history.type', 'type')
      .addSelect('MAX(server.name)', 'server')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(history.real_spent), 0)', 'real')
      .addSelect('COALESCE(SUM(history.virtual_spent), 0)', 'virtual')
      .where('history.type IN (:...types)', { types: HistoryGroupType.Purchase })
      .andWhere('history.created BETWEEN :from AND :to', { from: from.toDate(), to: to.toDate() })
      .andWhere(allowed ? 'history.server_id IN(:...allowed)' : '1 = 1', { allowed: allowed?.length ? allowed : [null] })
      .setParameters({
        product: HistoryType.ProductPurchase,
        kit: HistoryType.KitPurchase,
        group: HistoryType.DonateGroupPurchase,
        permission: HistoryType.DonatePermissionPurchase,
      })
      .groupBy('name')
      .addGroupBy('history.type')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    return rows.map((row) => ({
      name: row.name ?? '—',
      type: row.type,
      server: row.server ?? null,
      count: Number(row.count),
      real: currencyUtils.roundByType(Number(row.real), SystemCurrency.REAL),
      virtual: currencyUtils.roundByType(Number(row.virtual), SystemCurrency.VIRTAUL),
    }));
  }

  async revenue(query: RevenueQuery, allowed: string[] | null = null): Promise<RevenueReport> {
    const from = query.from
      ? this.moment(query.from).utc().startOf('day')
      : this.moment()
          .utc()
          .subtract(DASHBOARD_MONTH_DAYS - 1, 'day')
          .startOf('day');
    const to = query.to ? this.moment(query.to).utc().endOf('day') : this.moment().utc().endOf('day');

    const rows = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoin('history.server', 'server')
      .select('history.server_id', 'server')
      .addSelect('MAX(server.name)', 'name')
      .addSelect('COALESCE(SUM(history.real_spent), 0)', 'real')
      .addSelect('COALESCE(SUM(history.virtual_spent), 0)', 'virtual')
      .addSelect('COUNT(*)', 'purchases')
      .addSelect(`SUM(CASE WHEN history.type = :product THEN 1 ELSE 0 END)`, 'products')
      .addSelect(`SUM(CASE WHEN history.type = :kit THEN 1 ELSE 0 END)`, 'kits')
      .addSelect(`SUM(CASE WHEN history.type = :group THEN 1 ELSE 0 END)`, 'groups')
      .addSelect(`SUM(CASE WHEN history.type = :permission THEN 1 ELSE 0 END)`, 'permissions')
      .where('history.type IN (:...types)', { types: HistoryGroupType.Purchase })
      .andWhere('history.created BETWEEN :from AND :to', { from: from.toDate(), to: to.toDate() })
      .andWhere(allowed ? 'history.server_id IN(:...allowed)' : '1 = 1', { allowed: allowed?.length ? allowed : [null] })
      .setParameters({
        product: HistoryType.ProductPurchase,
        kit: HistoryType.KitPurchase,
        group: HistoryType.DonateGroupPurchase,
        permission: HistoryType.DonatePermissionPurchase,
      })
      .groupBy('history.server_id')
      .orderBy('`real`', 'DESC')
      .getRawMany();

    const report: RevenueRow[] = rows.map((row) => ({
      server: row.server,
      name: row.name ?? row.server ?? null,
      real: currencyUtils.roundByType(Number(row.real), SystemCurrency.REAL),
      virtual: currencyUtils.roundByType(Number(row.virtual), SystemCurrency.VIRTAUL),
      purchases: Number(row.purchases),
      products: Number(row.products),
      kits: Number(row.kits),
      groups: Number(row.groups),
      permissions: Number(row.permissions),
    }));

    const sum = (key: keyof Omit<RevenueRow, 'server' | 'name'>) => report.reduce((total, row) => total + row[key], 0);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      rows: report,
      total: {
        real: currencyUtils.roundByType(sum('real'), SystemCurrency.REAL),
        virtual: currencyUtils.roundByType(sum('virtual'), SystemCurrency.VIRTAUL),
        purchases: sum('purchases'),
        products: sum('products'),
        kits: sum('kits'),
        groups: sum('groups'),
        permissions: sum('permissions'),
      },
    };
  }

  private async daysStatBuilder(type: StatType, days: number = DASHBOARD_WEEK_DAYS, allowed: string[] | null = null): Promise<StatGroup[]> {
    var result: StatGroup[] = new Array();
    const range = Array.from(
      this.moment
        .range(
          this.moment()
            .subtract(days - 1, 'day')
            .startOf('day'),
          this.moment(),
        )
        .by('day'),
    );

    switch (type) {
      case StatType.User:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            count: await this.usersRepository.countBy({
              username: Not(KERNEL_USERNAME),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
            }),
          })),
        );
        break;
      case StatType.Online:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            amount:
              (
                await this.onlinesRecordsRepository.findOne({
                  where: {
                    created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
                  },
                  order: {
                    online: 'DESC',
                  },
                })
              )?.online || 0,
          })),
        );
        break;
      case StatType.Purchase:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            count: await this.historyRepository.countBy({
              type: In(HistoryGroupType.Purchase),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
              ...(allowed ? { server: { id: In(allowed.length ? allowed : ['']) } } : {}),
            }),
            amount: Number(
              (
                await this.historyRepository
                  .createQueryBuilder()
                  .where('type IN(:...types)', {
                    types: HistoryGroupType.Purchase,
                  })
                  .andWhere('created BETWEEN :start AND :end', {
                    start: this.moment(date).toDate(),
                    end: this.moment(date).endOf('day').toDate(),
                  })
                  .andWhere(allowed ? 'server_id IN(:...allowed)' : '1 = 1', { allowed: allowed?.length ? allowed : [null] })
                  .select('COALESCE(SUM(real_spent), 0)', 'amount')
                  .getRawOne()
              )?.amount || 0,
            ),
          })),
        );
        break;
      case StatType.Payment:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            count: await this.paymentsRepository.countBy({
              status: PaymentStatuses.PAID,
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
            }),
            amount: Number(
              (
                await this.paymentsRepository
                  .createQueryBuilder()
                  .where('status = :status', { status: PaymentStatuses.PAID })
                  .andWhere('created BETWEEN :start AND :end', {
                    start: this.moment(date).toDate(),
                    end: this.moment(date).endOf('day').toDate(),
                  })
                  .select('SUM(amount)', 'amount')
                  .getRawOne()
              )?.amount || 0,
            ),
          })),
        );
        break;
    }

    return result;
  }

  private async monthsStatBuilder(type: StatType, allowed: string[] | null = null): Promise<StatGroup[]> {
    var result: StatGroup[] = new Array();
    const range = Array.from(this.moment.range(this.moment().subtract(11, 'months').startOf('month'), this.moment()).by('month'));

    switch (type) {
      case StatType.User:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            count: await this.usersRepository.countBy({
              username: Not(KERNEL_USERNAME),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
            }),
          })),
        );
        break;
      case StatType.Online:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            amount:
              (
                await this.onlinesRecordsRepository.findOne({
                  where: {
                    created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
                  },
                  order: {
                    online: 'DESC',
                  },
                })
              )?.online || 0,
          })),
        );
        break;
      case StatType.Purchase:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            count: await this.historyRepository.countBy({
              type: In(HistoryGroupType.Purchase),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
              ...(allowed ? { server: { id: In(allowed.length ? allowed : ['']) } } : {}),
            }),
            amount: Number(
              (
                await this.historyRepository
                  .createQueryBuilder()
                  .where('type IN(:...types)', {
                    types: HistoryGroupType.Purchase,
                  })
                  .andWhere('created BETWEEN :start AND :end', {
                    start: this.moment(date).toDate(),
                    end: this.moment(date).endOf('month').toDate(),
                  })
                  .andWhere(allowed ? 'server_id IN(:...allowed)' : '1 = 1', { allowed: allowed?.length ? allowed : [null] })
                  .select('COALESCE(SUM(real_spent), 0)', 'amount')
                  .getRawOne()
              )?.amount || 0,
            ),
          })),
        );
        break;
      case StatType.Payment:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            count: await this.paymentsRepository.countBy({
              status: PaymentStatuses.PAID,
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
            }),
            amount: Number(
              (
                await this.paymentsRepository
                  .createQueryBuilder()
                  .where('status = :status', { status: PaymentStatuses.PAID })
                  .andWhere('created BETWEEN :start AND :end', {
                    start: this.moment(date).toDate(),
                    end: this.moment(date).endOf('month').toDate(),
                  })
                  .select('SUM(amount)', 'amount')
                  .getRawOne()
              )?.amount || 0,
            ),
          })),
        );
        break;
    }

    return result;
  }

  async stats(
    sections: DashboardStatSection[] = DASHBOARD_STAT_SECTIONS,
    purchaseServers: string[] | null = null,
  ): Promise<StatsInterface> {
    const online = await this.onlineService.find();
    const allowed = new Set(sections);

    const stats: StatsInterface = {};

    if (allowed.has('payments'))
      stats.payments = {
        days: await this.daysStatBuilder(StatType.Payment),
        month: await this.daysStatBuilder(StatType.Payment, DASHBOARD_MONTH_DAYS),
        months: await this.monthsStatBuilder(StatType.Payment),
        count: await this.paymentsRepository.countBy({
          status: PaymentStatuses.PAID,
        }),
        amount: Number(
          (
            await this.paymentsRepository
              .createQueryBuilder()
              .where('status = :status', { status: PaymentStatuses.PAID })
              .select('SUM(amount)', 'amount')
              .getRawOne()
          )?.amount || 0,
        ),
      };

    if (allowed.has('purchases'))
      stats.purchases = {
        days: await this.daysStatBuilder(StatType.Purchase, DASHBOARD_WEEK_DAYS, purchaseServers),
        month: await this.daysStatBuilder(StatType.Purchase, DASHBOARD_MONTH_DAYS, purchaseServers),
        months: await this.monthsStatBuilder(StatType.Purchase, purchaseServers),
        count: await this.historyRepository.countBy({
          type: In(HistoryGroupType.Purchase),
          ...(purchaseServers ? { server: { id: In(purchaseServers.length ? purchaseServers : ['']) } } : {}),
        }),
        amount: Number(
          (
            await this.historyRepository
              .createQueryBuilder()
              .where('type IN(:...types)', { types: HistoryGroupType.Purchase })
              .andWhere(purchaseServers ? 'server_id IN(:...allowed)' : '1 = 1', {
                allowed: purchaseServers?.length ? purchaseServers : [null],
              })
              .select('COALESCE(SUM(real_spent), 0)', 'amount')
              .getRawOne()
          )?.amount || 0,
        ),
      };

    if (allowed.has('online_records'))
      stats.online_records = {
        days: await this.daysStatBuilder(StatType.Online),
        month: await this.daysStatBuilder(StatType.Online, DASHBOARD_MONTH_DAYS),
        months: await this.monthsStatBuilder(StatType.Online),
        amount: online.total.records.absolute.online,
        date: online.total.records.absolute.created,
      };

    if (allowed.has('users'))
      stats.users = {
        days: await this.daysStatBuilder(StatType.User),
        month: await this.daysStatBuilder(StatType.User, DASHBOARD_MONTH_DAYS),
        months: await this.monthsStatBuilder(StatType.User),
        count: await this.usersRepository.countBy({ username: Not(KERNEL_USERNAME) }),
      };

    return stats;
  }
}
