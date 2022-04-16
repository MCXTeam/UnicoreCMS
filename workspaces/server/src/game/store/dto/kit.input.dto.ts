import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsDefined()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  servers: string[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  categories: number[];

  @IsDefined()
  @IsArray()
  @Type(() => KitItemInput)
  items: KitItemInput[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtual_percent?: number
}
