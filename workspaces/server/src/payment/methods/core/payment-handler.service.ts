import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { User } from 'src/admin/users/entities/user.entity';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Bonus } from 'src/payment/bonuses/entities/bonus.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentStatuses } from 'src/payment/enums/payment-statuses.enum';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

export class PaymentHandlerService {
  private readonly logger = new Logger(PaymentHandlerService.name);

  constructor(
    private historyService: HistoryService,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Bonus) private bonusesRepo: Repository<Bonus>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  create(method: string, amount: number, user: User, ip: string): Promise<Payment> {
    const payment = new Payment();

    payment.method = method;
    payment.status = PaymentStatuses.WAITING;
    payment.amount = amount;
    payment.user = user;
    payment.ip = ip;

    return this.paymentsRepo.save(payment);
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

    if (reported != null && Number(reported) !== Number(payment.amount))
      this.logger.warn(`Payment #${id}: provider reported ${reported}, expected ${payment.amount}`);

    const bonus = await this.bonusesRepo.findOne({ order: { amount: 'DESC' }, where: { amount: LessThanOrEqual(payment.amount) } });

    let credit = currencyUtils.roundByType(payment.amount, SystemCurrency.REAL);

    if (bonus && bonus.bonus > 0)
      credit = currencyUtils.roundByType(credit + (payment.amount * bonus.bonus) / 100, SystemCurrency.REAL);

    await this.usersRepo.increment({ uuid: payment.user.uuid }, 'real', credit);
    await this.historyService.create(HistoryType.Payment, payment.ip, payment.user, payment);

    return true;
  }
}
