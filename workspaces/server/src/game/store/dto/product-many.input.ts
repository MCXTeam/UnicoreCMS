import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { BULK_ITEMS_MAX, PRICE_MIN, SERVER_ID_MAX_LENGTH } from '@common';

export class ProductManyInput {
  @IsDefined()
  @IsInt()
  id: number;

  @IsOptional()
  @IsNumber()
  @Min(PRICE_MIN)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @MaxLength(SERVER_ID_MAX_LENGTH, { each: true })
  servers?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  categories?: number[];
}

export class ProductsManyInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => ProductManyInput)
  products: ProductManyInput[];
}
