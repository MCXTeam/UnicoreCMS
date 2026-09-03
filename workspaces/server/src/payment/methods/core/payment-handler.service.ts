import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { User } from 'src/admin/users/entities/user.entity';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { ReferalsService } from 'src/game/cabinet/referals/referals.service';
import { Bonus } from 'src/payment/bonuses/entities/bonus.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentStatuses } from 'src/payment/enums/payment-statuses.enum';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { events } from 'unicore-api';
import { AuditService } from 'src/common/audit';
import { runAfterCommit } from 'src/common/utils/transaction';

export class PaymentHandlerService {
  private readonly logger = new Logger(PaymentHandlerService.name);

  constructor(
    private historyService: HistoryService,
    private referalsService: ReferalsService,
    private auditService: AuditService,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Bonus) private bonusesRepo: Repository<Bonus>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async create(method: string, amount: number, user: User, ip: string): Promise<Payment> {
    const payment = new Payment();

    payment.method = method;
    payment.status = PaymentStatuses.WAITING;
    payment.amount = amount;
    payment.user = user;
    payment.ip = ip;

    const saved = await this.paymentsRepo.save(payment);

    await events().emit('payment.created', { id: saved.id, uuid: user.uuid, amount: Number(saved.amount), method });

    this.auditService.record({
      action: 'payment.created',
      actor: { type: 'user', id: user.uuid, name: user.username },
      ip,
      target: { type: 'payment', id: String(saved.id) },
      meta: { method, amount: Number(saved.amount) },
    });

    return saved;
  }

  @Transactional()
  async handler(id: number, bill_id: string = null, reported?: number): Promise<boolean> {
    const claim = await this.paymentsRepo
      .createQueryBuilder()
      .update(Payment)
      .set(bill_id ? { status: PaymentStatuses.PAID, bill_id } : { status: PaymentStatuses.PAID })
      .where('id = :id AND status = :status', { id, status: PaymentStatuses.WAITING })
      .execute();

    if (!claim.affected) return false;

    const payment = await this.paymentsRepo.findOne({ where: { id }, relations: ['user'] });

    if (!payment) return false;

    const expected = Number(payment.amount);
    const declared = Number(reported);
    const paid = reported != null && Number.isFinite(declared) ? Math.min(declared, expected) : expected;

    if (paid !== expected) {
      this.logger.warn(`Платёж #${id}: провайдер сообщил ${reported}, ожидалось ${expected}, зачислено ${paid}`);

      payment.amount = paid;

      await this.paymentsRepo.update({ id }, { amount: paid });
    }

    const bonus = await this.bonusesRepo.findOne({ order: { amount: 'DESC' }, where: { amount: LessThanOrEqual(paid) } });

    let credit = currencyUtils.roundByType(paid, SystemCurrency.REAL);

    if (bonus && bonus.bonus > 0) credit = currencyUtils.roundByType(credit + (paid * bonus.bonus) / 100, SystemCurrency.REAL);

    await this.usersRepo.increment({ uuid: payment.user.uuid }, 'real', credit);
    await this.historyService.create(HistoryType.Payment, payment.ip, payment.user, payment);

    const reward = await this.referalsService.paymentReward(payment.user, paid);

    if (reward) {
      await this.usersRepo.increment({ uuid: reward.inviter.uuid }, 'real', reward.amount);
      await this.historyService.create(HistoryType.ReferalReward, payment.ip, reward.inviter, payment.user, payment, reward.amount);

      this.auditService.record({
        action: 'payment.referal',
        actor: { type: 'payment', id: payment.method },
        target: { type: 'user', id: reward.inviter.uuid, name: reward.inviter.username },
        meta: { payment: id, amount: reward.amount, from: payment.user.username },
      });
    }

    runAfterCommit(() => events().emit('payment.paid', { id, uuid: payment.user.uuid, amount: credit, method: payment.method }));

    this.auditService.record({
      action: 'payment.paid',
      actor: { type: 'payment', id: payment.method },
      ip: payment.ip,
      target: { type: 'user', id: payment.user.uuid, name: payment.user.username },
      meta: { payment: id, method: payment.method, paid, credit, bonus: bonus?.bonus },
    });

    return true;
  }
}
