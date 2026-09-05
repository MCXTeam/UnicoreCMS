import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterOperator, PaginateQuery, Paginated, paginate } from '@common';
import { MANUAL_PAYMENT_METHOD, PAYMENT_PLAYERS_LIMIT, PAYMENT_TOP_LIMIT } from 'unicore-common';
import { User } from 'src/admin/users/entities/user.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentStatuses } from 'src/payment/enums/payment-statuses.enum';
import { PaymentHandlerService } from 'src/payment/methods/core/payment-handler.service';
import { PaymentCreateInput } from './dto/payment-create.input';
import { PaymentUpdateInput } from './dto/payment-update.input';

export interface PaymentTopRow {
  uuid: string;
  username: string;
  total: number;
  payments: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private handler: PaymentHandlerService,
  ) {}

  find(query: PaginateQuery): Promise<Paginated<Payment>> {
    const builder = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.user', 'user')
      .addSelect(['user.uuid', 'user.username']);

    return paginate(query, builder, {
      sortableColumns: ['id', 'amount', 'created', 'status', 'method'],
      searchableColumns: ['method', 'bill_id'],
      defaultSortBy: [['created', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
        method: [FilterOperator.EQ],
        created: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
      maxLimit: 200,
    });
  }

  async top(): Promise<PaymentTopRow[]> {
    const rows = await this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.user', 'user')
      .select('user.uuid', 'uuid')
      .addSelect('user.username', 'username')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'payments')
      .where('payment.status = :status', { status: PaymentStatuses.PAID })
      .andWhere('user.uuid IS NOT NULL')
      .groupBy('user.uuid')
      .addGroupBy('user.username')
      .orderBy('total', 'DESC')
      .limit(PAYMENT_TOP_LIMIT)
      .getRawMany();

    return rows.map((row) => ({
      uuid: row.uuid,
      username: row.username,
      total: Number(row.total) || 0,
      payments: Number(row.payments) || 0,
    }));
  }

  async players(search: string): Promise<{ uuid: string; username: string }[]> {
    const value = String(search ?? '').trim();

    const builder = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.uuid', 'user.username'])
      .orderBy('user.username', 'ASC')
      .limit(PAYMENT_PLAYERS_LIMIT);

    if (value) builder.where('user.username LIKE :value', { value: `%${value}%` });

    const rows = await builder.getMany();

    return rows.map((user) => ({ uuid: user.uuid, username: user.username }));
  }

  async update(id: number, input: PaymentUpdateInput): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({ where: { id }, relations: ['user'] });

    if (!payment) throw new NotFoundException();

    if (payment.status === PaymentStatuses.PAID)
      throw new BadRequestException('Завершённое пополнение изменить нельзя: деньги уже зачислены');

    if (input.amount !== undefined) {
      const amount = Number(input.amount);

      if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Некорректная сумма');

      await this.paymentsRepository.update({ id }, { amount });
    }

    if (input.status === PaymentStatuses.PAID) await this.handler.handler(id);

    return this.paymentsRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async create(input: PaymentCreateInput): Promise<Payment> {
    const user = await this.usersRepository.findOne({ where: { username: input.username } });

    if (!user) throw new NotFoundException('Игрок не найден');

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Некорректная сумма');

    const payment = await this.handler.create(input.method || MANUAL_PAYMENT_METHOD, amount, user, null);

    if (input.paid) await this.handler.handler(payment.id);

    return this.paymentsRepository.findOne({ where: { id: payment.id }, relations: ['user'] });
  }
}
