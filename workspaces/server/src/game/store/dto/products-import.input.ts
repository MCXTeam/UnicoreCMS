import { IsOptional, IsString } from "class-validator";

export class ProductsImportInput {
  @IsOptional()
  @IsString()
  servers?: string;

  @IsOptional()
  @IsString()
  categories?: string;
}