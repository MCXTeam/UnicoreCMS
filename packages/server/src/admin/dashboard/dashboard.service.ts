import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as _ from 'lodash';
import { User } from '../users/entities/user.entity';
import { StatGroup } from './interfaces/stat.interface';
import { StatType } from './enums/stat-type.enum';
import { MomentWrapper } from '@common';
import { OnlinesRecord } from 'src/game/servers/online/entities/onlines-record.entity';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { HistoryGroupType } from 'src/game/cabinet/history/enums/history-type.enum';
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

  private async daysStatBuilder(type: StatType): Promise<StatGroup[]> {
    var result: StatGroup[] = new Array();
    const range = Array.from(this.moment.range(this.moment().subtract(6, 'day').startOf('day'), this.moment()).by('day'));

    switch (type) {
      case StatType.User:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            count: await this.usersRepository.count({
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
                  created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
                })
              )?.online || 0,
          })),
        );
        break;
      case StatType.Purchase:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).utc().toDate(),
            count: await this.historyRepository.count({
              type: In(HistoryGroupType.Purchase),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('day').toDate()),
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
                  .select('SUM(amount)', 'amount')
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
            count: await this.paymentsRepository.count({
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

  private async monthsStatBuilder(type: StatType): Promise<StatGroup[]> {
    var result: StatGroup[] = new Array();
    const range = Array.from(this.moment.range(this.moment().subtract(11, 'months').startOf('month'), this.moment()).by('month'));

    switch (type) {
      case StatType.User:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            count: await this.usersRepository.count({
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
                  created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
                })
              )?.online || 0,
          })),
        );
        break;
      case StatType.Purchase:
        result = await Promise.all(
          range.map(async (date) => ({
            date: this.moment(date).toDate(),
            count: await this.historyRepository.count({
              type: In(HistoryGroupType.Purchase),
              created: Between(this.moment(date).toDate(), this.moment(date).endOf('month').toDate()),
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
                  .select('SUM(amount)', 'amount')
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
            count: await this.paymentsRepository.count({
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

  async stats(): Promise<StatsInterface> {
    const online = await this.onlineService.find();

    return {
      payments: {
        days: await this.daysStatBuilder(StatType.Payment),
        months: await this.monthsStatBuilder(StatType.Payment),
        count: await this.paymentsRepository.count({
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
      },
      purchases: {
        days: await this.daysStatBuilder(StatType.Purchase),
        months: await this.monthsStatBuilder(StatType.Purchase),
        count: await this.historyRepository.count({
          type: In(HistoryGroupType.Purchase),
        }),
        amount: Number(
          (
            await this.historyRepository
              .createQueryBuilder()
              .where('type IN(:...types)', { types: HistoryGroupType.Purchase })
              .select('SUM(amount)', 'amount')
              .getRawOne()
          )?.amount || 0,
        ),
      },
      online_records: {
        days: await this.daysStatBuilder(StatType.Online),
        months: await this.monthsStatBuilder(StatType.Online),
        amount: online.total.records.absolute.online,
        date: online.total.records.absolute.created,
      },
      users: {
        days: await this.daysStatBuilder(StatType.User),
        months: await this.monthsStatBuilder(StatType.User),
        count: await this.usersRepository.count(),
      },
    };
  }
}
