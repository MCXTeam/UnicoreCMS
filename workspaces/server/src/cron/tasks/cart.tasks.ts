import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment";
import { History } from "src/game/cabinet/history/entities/history.entity";
import { CartItemKit } from "src/game/store/cart/entities/cart-item-kit.entity";
import { CartItem } from "src/game/store/cart/entities/cart-item.entity";
import { LessThan, Repository } from "typeorm";

export class CartTasks {
  constructor(
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(CartItemKit)
    private cartItemKitsRepository: Repository<CartItemKit>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    const cartItemsClean = await this.cartItemsRepository.find({
      updated: LessThan(moment().add(30, 'days').toDate()),
    });
    const cartItemKitsClean = await this.cartItemKitsRepository.find({
      updated: LessThan(moment().add(30, 'days').toDate()),
    });

    await this.cartItemsRepository.remove(cartItemsClean);
    await this.cartItemKitsRepository.remove(cartItemKitsClean);
  }
}