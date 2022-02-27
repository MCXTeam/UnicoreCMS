import { IsDecimal, IsDefined, IsInt, IsOptional, IsString, Min, IsArray, Max, IsNumber } from 'class-validator';

export class ProductInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDefined()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsDefined()
  @IsString()
  item_id: string;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  servers: string[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  categories: number[];
}
