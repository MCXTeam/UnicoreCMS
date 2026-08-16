import { IsDate, IsDateString, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GiftType } from '../enums/gift-type.enum';
import { NAME_MAX_LENGTH, PRICE_MAX, PRICE_MIN, SERVER_ID_MAX_LENGTH } from '@common';

export class GiftInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  promocode: string;

  @IsDefined()
  @IsEnum(GiftType)
  type: GiftType;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_activations?: number;

  @IsOptional()
  @IsDateString()
  expires?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  product?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  kit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  donate_group?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  donate_permission?: number;

  @IsOptional()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  server?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  period?: number;

  @IsOptional()
  @IsNumber()
  @Min(PRICE_MIN)
  @Max(PRICE_MAX)
  amount?: number;
}
