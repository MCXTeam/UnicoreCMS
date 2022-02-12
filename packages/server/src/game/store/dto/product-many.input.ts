import { Type } from "class-transformer"
import { IsDefined, IsInt, IsNumber, IsOptional, IsString, Length, IsArray, Min, Max } from "class-validator"

export class ProductManyInput {
  @IsDefined()
  @IsInt()
  id: number

  @IsOptional()
  @IsNumber()
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale?: number

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
  @Type(() => ProductManyInput)
  products: ProductManyInput[]
}