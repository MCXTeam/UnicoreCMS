import { IsDefined, IsNumber, Max, Min } from 'class-validator';
import { BONUS_MAX_PERCENT, PRICE_MIN } from '@common';

export class BonusInput {
  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  amount: number;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  @Max(BONUS_MAX_PERCENT)
  bonus: number;
}
