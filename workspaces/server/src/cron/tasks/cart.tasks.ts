import { SafeCron } from '@common';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { CartItemKit } from 'src/game/store/cart/entities/cart-item-kit.entity';
import { CartItem } from 'src/game/store/cart/entities/cart-item.entity';
import { LessThan, Repository } from 'typeorm';

export class CartTasks {
  constructor(
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(CartItemKit)
    private cartItemKitsRepository: Repository<CartItemKit>,
  ) {}

  @SafeCron(CronExpression.EVERY_HOUR, 'cart-cleanup')
  async clean() {
    const cartItemsClean = await this.cartItemsRepository.findBy({
      updated: LessThan(moment().utc().subtract(30, 'days').toDate()),
    });
    const cartItemKitsClean = await this.cartItemKitsRepository.findBy({
      updated: LessThan(moment().utc().subtract(30, 'days').toDate()),
    });

    await this.cartItemsRepository.remove(cartItemsClean);
    await this.cartItemKitsRepository.remove(cartItemKitsClean);
  }
}
