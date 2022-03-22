import { IsDefined, IsNumber } from 'class-validator';

export class BonusInput {
  @IsDefined()
  @IsNumber()
  amount: number;

  @IsDefined()
  @IsNumber()
  bonus: number;
}
