import { Module } from '@nestjs/common';
import { WarehouseModule } from './warehouse/warehouse.module';
import { CartModule } from './cart/cart.module';
import { StoreController } from './controllers/store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoriesService } from './providers/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { KitsController } from './controllers/kits.controller';
import { Category } from './entities/category.entity';
import { Server } from '../servers/entities/server.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './providers/product.service';
import { KitsService } from './providers/kits.service';
import { Kit } from './entities/kit.entity';

@Module({
  providers: [CategoriesService, ProductsService, KitsService],
  imports: [TypeOrmModule.forFeature([Category, Product, Server, Kit]), WarehouseModule, CartModule],
  controllers: [StoreController, CategoriesController, KitsController, ProductsController],
})
export class StoreModule {}
