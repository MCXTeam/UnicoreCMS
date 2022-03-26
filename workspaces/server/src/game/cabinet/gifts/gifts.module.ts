import { Module } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/game/store/entities/product.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Period } from 'src/game/donate/entities/period.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { Gift } from './entities/gift.entity';
import { GiftActivation } from './entities/gift-activation.entity';
import { MoneyModule } from '../money/money.module';
import { Money } from '../money/entities/money.entity';
import { DonatePermissionsModule } from 'src/game/donate/permissions/permissions.module';
import { DonateGroupsModule } from 'src/game/donate/groups/groups.module';
import { CartModule } from 'src/game/store/cart/cart.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Kit, DonateGroup, DonatePermission, Period, Server, User, Gift, GiftActivation, Money]), MoneyModule, DonatePermissionsModule, DonateGroupsModule, CartModule],
  providers: [GiftsService],
  controllers: [GiftsController],
})
export class GiftsModule { }
