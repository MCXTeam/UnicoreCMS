import { Exclude, Expose, instanceToPlain, Transform, Type } from 'class-transformer';
import { Paginated } from 'nestjs-paginate';
import { KitItem } from '../entities/kit-item.entity';
import { Kit } from '../entities/kit.entity';
import { Product } from '../entities/product.entity';

export enum PayloadType {
  Product = 'product',
  Kit = 'kit',
}

export class ProductProtectedDto {
  @Exclude()
  nbt: string;

  @Exclude()
  item_id: string;

  @Exclude()
  give_method: string;

  @Exclude()
  command: string;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}

export class KitItemProtectedDto {
  @Transform(({ value }) => instanceToPlain(new ProductProtectedDto(value)))
  product: ProductProtectedDto[];

  constructor(partial: Partial<KitItem>) {
    Object.assign(this, partial);
  }
}

export class KitProtectedDto {
  @Transform(({ value }) => value.map((v) => instanceToPlain(new KitItemProtectedDto(v))))
  items: KitItemProtectedDto[];

  constructor(partial: Partial<Kit>) {
    Object.assign(this, partial);
  }
}

export interface StoreDtoUnprotect {
  type: PayloadType;
  payload: Kit | Product;
}

export class StoreDto {
  type: PayloadType;

  @Exclude()
  payload: Kit | Product;

  @Expose({ name: 'payload' })
  get payloadProtected() {
    if (this.type == PayloadType.Kit) return instanceToPlain(new KitProtectedDto(this.payload));
    else return instanceToPlain(new ProductProtectedDto(this.payload));
  }

  constructor(partial: Partial<StoreDtoUnprotect>) {
    Object.assign(this, partial);
  }
}

export class PaginatedStoreDto extends Paginated<StoreDtoUnprotect> {
  @Transform(({ value }) => value.map((v) => instanceToPlain(new StoreDto(v))))
  data: StoreDto[];

  constructor(partial: Partial<Paginated<StoreDtoUnprotect>>) {
    super();
    Object.assign(this, partial);
  }
}
