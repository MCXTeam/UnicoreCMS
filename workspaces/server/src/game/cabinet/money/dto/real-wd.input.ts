import { IsDefined, IsNumber, IsString, Max, Min } from 'class-validator';
import { PRICE_MAX } from '@common';

export class RealWDInput {
  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsDefined()
  @IsNumber()
  @Min(0.01)
  @Max(PRICE_MAX)
  amount: number;
}
