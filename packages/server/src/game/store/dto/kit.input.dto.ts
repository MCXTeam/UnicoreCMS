import { IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator"

export class KitInput {
  @IsDefined()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description: string

  @IsDefined()
  @IsNumber()
  price: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number

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
  @IsInt({ each: true })
  products: number[];
}