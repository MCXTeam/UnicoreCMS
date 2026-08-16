import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDefined, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { BULK_ITEMS_MAX, NAME_MAX_LENGTH, PRICE_MIN, SanitizeHtml, SERVER_ID_MAX_LENGTH } from '@common';

export class KitItemInput {
  @IsDefined()
  @IsNumber()
  product_id: number;

  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class KitInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @MaxLength(SERVER_ID_MAX_LENGTH, { each: true })
  servers: string[];

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  categories: number[];

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => KitItemInput)
  items: KitItemInput[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtual_percent?: number;
}
