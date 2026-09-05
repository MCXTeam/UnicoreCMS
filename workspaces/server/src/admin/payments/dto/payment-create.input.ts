import { IsBoolean, IsDefined, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NAME_MAX_LENGTH, PRICE_MIN } from '@common';

export class PaymentCreateInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  username: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  method?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}
