import { Exclude, instanceToPlain, Transform, Type } from "class-transformer";
import { Paginated } from "nestjs-paginate";
import { Product } from "../entities/product.entity";

export class ProductProtectedDto {
  @Exclude()
  nbt: string

  @Exclude()
  item_id: string

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}

export class PaginatedProductProtectedDto extends Paginated<ProductProtectedDto> {
  @Transform(({ value }) => value.map(v => instanceToPlain(new ProductProtectedDto(v))))
  data: ProductProtectedDto[];

  constructor(partial: Partial<Paginated<Product>>) {
    super()
    Object.assign(this, partial);
  }
}