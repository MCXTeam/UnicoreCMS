import { IsBoolean, IsDefined, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { CART_AMOUNT_MAX, CART_AMOUNT_MIN, IsUsername, SERVER_ID_MAX_LENGTH } from '@common';
import { GiftType } from '../enums/gift-type.enum';

export class GiftPurchaseInput {
  @IsDefined()
  @IsEnum(GiftType)
  type: GiftType;

  @ValidateIf((input: GiftPurchaseInput) => !input.grant)
  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  server: string;

  @IsOptional()
  @IsInt()
  donate_group?: number;

  @IsOptional()
  @IsInt()
  donate_permission?: number;

  @IsOptional()
  @IsInt()
  product?: number;

  @IsOptional()
  @IsInt()
  kit?: number;

  @IsOptional()
  @IsInt()
  period?: number;

  @IsOptional()
  @IsInt()
  grant?: number;

  @IsOptional()
  @IsInt()
  @Min(CART_AMOUNT_MIN)
  @Max(CART_AMOUNT_MAX)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  use_virtual?: boolean;

  @IsOptional()
  @IsUsername()
  recipient?: string;
}
