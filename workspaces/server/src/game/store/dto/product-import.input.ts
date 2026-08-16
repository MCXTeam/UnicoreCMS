import { IsArray, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { NAME_MAX_LENGTH, PRICE_MAX, PRICE_MIN, RCON_COMMAND_MAX_LENGTH, SALE_MAX_PERCENT, SanitizeHtml, TEXT_MAX_LENGTH } from '@common';
import { GiveMethod } from '../enums/give-method.enum';

export class ProductImportInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  icon?: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  nbt?: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  @Max(PRICE_MAX)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(SALE_MAX_PERCENT)
  sale?: number;

  @IsDefined()
  @IsEnum(GiveMethod)
  give_method: GiveMethod;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  item_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(RCON_COMMAND_MAX_LENGTH, { each: true })
  commands?: string[];
}
