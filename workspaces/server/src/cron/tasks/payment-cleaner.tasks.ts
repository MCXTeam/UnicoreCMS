import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { KEEP_FOREVER, KEEP_PAID_PAYMENTS_DAYS, KEEP_PENDING_PAYMENTS_DAYS, SafeCron } from '@common';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentStatuses } from 'src/payment/enums/payment-statuses.enum';
import { LessThan, Repository } from 'typeorm';

export class PaymentTasks {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private configService: ConfigService,
  ) {}

  private days(value: unknown, fallback: number): number {
    const days = Number(value);

    return Number.isFinite(days) && days >= KEEP_FOREVER ? days : fallback;
  }

  private async removeOlderThan(status: PaymentStatuses, days: number) {
    if (days === KEEP_FOREVER) return;

    const payments = await this.paymentsRepository.findBy({
      status,
      updated: LessThan(moment().utc().subtract(days, 'days').toDate()),
    });

    await this.paymentsRepository.remove(payments);
  }

  @SafeCron(CronExpression.EVERY_HOUR, 'payments-cleanup')
  async clean() {
    const config = await this.configService.load();

    await this.removeOlderThan(PaymentStatuses.WAITING, this.days(config[ConfigField.KeepPendingPaymentsDays], KEEP_PENDING_PAYMENTS_DAYS));
    await this.removeOlderThan(PaymentStatuses.PAID, this.days(config[ConfigField.KeepPaidPaymentsDays], KEEP_PAID_PAYMENTS_DAYS));
  }
}
