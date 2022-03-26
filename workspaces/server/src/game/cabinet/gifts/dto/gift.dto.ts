import { Exclude, Type } from "class-transformer";
import { ProductProtectedDto } from "src/game/store/dto/paginated-store.dto";
import { GiftActivation } from "../entities/gift-activation.entity";
import { Gift } from "../entities/gift.entity";

export class GiftDto {
  @Type(() => ProductProtectedDto)
  product?: ProductProtectedDto;

  @Exclude()
  activations?: GiftActivation[];

  constructor(partial: Partial<Gift>) {
    Object.assign(this, partial);
  }
}