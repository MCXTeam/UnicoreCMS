import { Module } from '@nestjs/common';
import { DonateGroupsService } from './providers/groups.service';
import { GroupsController } from './controllers/groups.controller';
import { GroupKitsService } from './providers/group-kit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupKit } from './entities/group-kit.entity';
import { GroupKitsController } from './controllers/group-kit.controller';
import { DonateGroup } from './entities/donate-group.entity';
import { Period } from '../entities/period.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { DonateGroupsController } from './controllers/group.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GroupKit, DonateGroup, Period, Server])],
  providers: [DonateGroupsService, GroupKitsService, DonateGroupsService],
  controllers: [GroupsController, GroupKitsController, DonateGroupsController],
})
export class DonateGroupsModule {}
