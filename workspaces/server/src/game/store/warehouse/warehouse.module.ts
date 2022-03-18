import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseItem } from './entities/warehouse-item.entity';
import { ServersModule } from 'src/game/servers/servers.module';
import UsersModule from 'src/admin/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseItem]), ServersModule, UsersModule],
  providers: [WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
