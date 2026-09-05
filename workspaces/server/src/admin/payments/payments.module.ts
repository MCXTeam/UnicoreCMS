import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentHandlerModule } from 'src/payment/methods/core/payment-handler.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, User]), PaymentHandlerModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class AdminPaymentsModule {}
