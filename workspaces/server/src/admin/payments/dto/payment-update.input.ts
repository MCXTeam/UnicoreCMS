import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { PAYMENT_STATUSES, PaymentStatus } from 'unicore-common';
import { PRICE_MIN } from '@common';

export class PaymentUpdateInput {
  @IsOptional()
  @IsNumber()
  @Min(PRICE_MIN)
  amount?: number;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES as unknown as string[])
  status?: PaymentStatus;
}
