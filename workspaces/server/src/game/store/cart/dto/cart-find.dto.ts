import { Transform } from "class-transformer";
import { CartProtected, CartUnprotect } from "./cart.dto";

export class CartFindDto {
  @Transform(({ value }) => value.map((val) => new CartProtected(val)))
  items: CartProtected

  constructor(partial: { 
    items: CartUnprotect[], 
    price: number, 
    virtual_sale: number 
  }) {
    Object.assign(this, partial);
  }
}