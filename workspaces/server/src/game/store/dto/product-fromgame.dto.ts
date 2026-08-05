import { IsDefined, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PRICE_MIN } from '@common';

export class ProductFromGameInput {
  @IsDefined()
  @IsString()
  id: string;

  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nbt: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  price: number;

  @IsDefined()
  @IsString()
  server: string;
}
