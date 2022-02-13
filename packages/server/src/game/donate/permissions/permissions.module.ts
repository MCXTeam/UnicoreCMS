import { Module } from '@nestjs/common';
import { DonatePermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonatePermission } from './entities/donate-permission.entity';
import { UsersDonatePermission } from './entities/user-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Period } from '../entities/period.entity';
import { GroupKit } from '../groups/entities/group-kit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DonatePermission, UsersDonatePermission, Server, Period, GroupKit])],
  providers: [DonatePermissionsService],
  controllers: [PermissionsController],
})
export class DonatePermissionsModule {}
