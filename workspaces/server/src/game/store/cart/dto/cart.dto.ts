import { Exclude, Expose, instanceToPlain, Transform } from 'class-transformer';
import { KitProtectedDto, PayloadType, ProductProtectedDto } from '../../dto/paginated-store.dto';
import { CartItemKit } from '../entities/cart-item-kit.entity';
import { CartItem } from '../entities/cart-item.entity';

export class CartItemProtected {
  @Transform(({ value }) => instanceToPlain(new ProductProtectedDto(value)))
  product: ProductProtectedDto[];

  constructor(partial: Partial<CartItem>) {
    Object.assign(this, partial);
  }
}

export class CartItemKitProtected {
  @Transform(({ value }) => instanceToPlain(new KitProtectedDto(value)))
  kit: KitProtectedDto[];

  constructor(partial: Partial<CartItemKit>) {
    Object.assign(this, partial);
  }
}

export interface CartUnprotect {
  type: PayloadType;
  payload: CartItem | CartItemKit;
}

export class CartProtected {
  type: PayloadType;

  @Exclude()
  payload: CartItem | CartItemKit;

  @Expose({ name: 'payload' })
  get payloadProtected() {
    if (this.type == PayloadType.Kit) return instanceToPlain(new CartItemKitProtected(this.payload));
    else return instanceToPlain(new CartItemProtected(this.payload));
  }

  constructor(partial: Partial<CartUnprotect>) {
    Object.assign(this, partial);
  }
}
