import { Module } from '@nestjs/common';
import { DonatePermissionsModule } from './permissions/permissions.module';
import { DonateGroupsModule } from './groups/groups.module';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Period } from './entities/period.entity';

@Module({
  imports: [DonatePermissionsModule, DonateGroupsModule, TypeOrmModule.forFeature([Period])],
  providers: [PeriodsService],
  controllers: [PeriodsController],
})
export class DonateModule {}
