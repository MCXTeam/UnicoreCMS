import { PRICE_MAX, PRICE_MIN } from '@common';
import { IsDefined, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class VirtualCurrencyUserUpdate {
  @IsDefined()
  @IsUUID()
  uuid: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  @Max(PRICE_MAX)
  amount: number;
}
