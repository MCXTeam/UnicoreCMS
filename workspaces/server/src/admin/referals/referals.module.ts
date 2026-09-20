import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { ReferalsModule } from 'src/game/cabinet/referals/referals.module';
import { User } from '../users/entities/user.entity';
import { AdminReferalsController } from './referals.controller';
import { AdminReferalsService } from './referals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Referal, User]), ReferalsModule],
  providers: [AdminReferalsService],
  controllers: [AdminReferalsController],
  exports: [AdminReferalsService],
})
export class AdminReferalsModule {}
