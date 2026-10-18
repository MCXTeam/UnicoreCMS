import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Payment } from './entities/payment.entity';
import { PaymentSettingsService } from './settings/payment-settings.service';

@Injectable()
export class PaymentService {
  private methods: string[] = new Array();

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private settings: PaymentSettingsService,
  ) {}

  async getMethods() {
    return [...new Set([...(await this.settings.enabledIds()), ...this.methods])];
  }

  async setMethods(methods: string[]) {
    this.methods = methods;
  }

  async findLast(user: User, method?: string): Promise<Payment> {
    return this.paymentsRepository.findOne({
      where: {
        user: { uuid: user.uuid },
        ...(method ? { method } : {}),
      },
      order: { created: 'DESC' },
    });
  }
}
