import { IsDefined, IsOptional, IsString, IsNumber } from 'class-validator';

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
  price: number;

  @IsDefined()
  @IsString()
  server: string;
}
