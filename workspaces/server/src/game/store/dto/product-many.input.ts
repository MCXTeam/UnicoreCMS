import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { PRICE_MIN } from '@common';

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
  @IsString({ each: true })
  servers?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categories?: number[];
}

export class ProductsManyInput {
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductManyInput)
  products: ProductManyInput[];
}
