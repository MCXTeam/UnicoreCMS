import { Module } from '@nestjs/common';
import { ReferalsService } from './referals.service';
import { ReferalsController } from './referals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referal } from './entities/referal.entity';
import { PlaytimeModule } from '../playtime/playtime.module';
import { ConfigModule } from 'src/admin/config/config.module';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Referal, UsersDonateGroup, UsersDonatePermission]), PlaytimeModule, ConfigModule],
  providers: [ReferalsService],
  exports: [ReferalsService],
  controllers: [ReferalsController],
})
export class ReferalsModule {}
