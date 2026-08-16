import { IsDefined, IsNumber, Max, Min } from 'class-validator';
import { PAYMENT_AMOUNT_MAX, PAYMENT_AMOUNT_MIN } from '@common';

export class PaymentCreateDto {
  @IsDefined()
  @IsNumber()
  @Min(PAYMENT_AMOUNT_MIN)
  @Max(PAYMENT_AMOUNT_MAX)
  amount: number;
}
