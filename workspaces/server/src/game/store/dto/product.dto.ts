import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDecimal, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GiveMethod } from '../enums/give-method.enum';
import { BULK_ITEMS_MAX, NAME_MAX_LENGTH, PRICE_MIN, RCON_COMMAND_MAX_LENGTH, SanitizeHtml, SERVER_ID_MAX_LENGTH, TEXT_MAX_LENGTH } from '@common';

export class ProductInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  nbt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  item_id: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @MaxLength(RCON_COMMAND_MAX_LENGTH, { each: true })
  commands: string[];

  @IsDefined()
  @IsEnum(GiveMethod)
  give_method: GiveMethod;

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @MaxLength(SERVER_ID_MAX_LENGTH, { each: true })
  servers: string[];

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  categories: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtual_percent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  multiple_of?: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsBoolean()
  giftable?: boolean;

}
