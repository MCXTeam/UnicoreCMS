import { IsDefined, IsInt, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { PERIOD_EXPIRE_MAX, PERIOD_MULTIPLIER_MAX, PERIOD_MULTIPLIER_MIN, NAME_MAX_LENGTH } from '@common';

export class PeriodInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(PERIOD_EXPIRE_MAX)
  expire: number;

  @IsDefined()
  @IsNumber()
  @Min(PERIOD_MULTIPLIER_MIN)
  @Max(PERIOD_MULTIPLIER_MAX)
  multiplier: number;
}
