import { IsDate, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GiftType } from '../enums/gift-type.enum';

export class GiftInput {
  @IsDefined()
  @IsString()
  promocode: string;

  @IsDefined()
  @IsEnum(GiftType)
  type: GiftType;

  @IsOptional()
  @IsInt()
  max_activations?: number;

  @IsOptional()
  @IsString()
  expires?: Date;

  @IsOptional()
  @IsInt()
  product?: number;

  @IsOptional()
  @IsInt()
  kit?: number;

  @IsOptional()
  @IsInt()
  donate_group?: number;

  @IsOptional()
  @IsInt()
  donate_permission?: number;

  @IsOptional()
  @IsString()
  server?: string;

  @IsOptional()
  @IsInt()
  period?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
