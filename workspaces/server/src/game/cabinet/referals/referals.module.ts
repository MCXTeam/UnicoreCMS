import { Module } from '@nestjs/common';
import { ReferalsService } from './referals.service';
import { ReferalsController } from './referals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referal } from './entities/referal.entity';
import { PlaytimeModule } from '../playtime/playtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Referal]), PlaytimeModule],
  providers: [ReferalsService],
  exports: [ReferalsService],
  controllers: [ReferalsController],
})
export class ReferalsModule {}
