import { IsDecimal, IsDefined, IsInt, IsOptional, IsString, Min, IsArray, Max, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { GiveMethod } from '../enums/give-method.enum';

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
  @IsString()
  nbt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsOptional()
  @IsString()
  item_id: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commands: string[];

  @IsDefined()
  @IsEnum(GiveMethod)
  give_method: GiveMethod;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  servers: string[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  categories: number[];

  @IsOptional()
  @IsBoolean()
  prevent_use_virtual?: boolean
}
