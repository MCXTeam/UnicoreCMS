import { Module } from '@nestjs/common';
import { DonateGroupsService } from './providers/groups.service';
import { GroupKitsService } from './providers/group-kit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupKit } from './entities/group-kit.entity';
import { GroupKitsController } from './controllers/group-kit.controller';
import { DonateGroup } from './entities/donate-group.entity';
import { Period } from '../entities/period.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { DonateGroupsController } from './controllers/group.controller';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersDonateGroup } from './entities/user-donate.entity';
import { HistoryModule } from 'src/game/cabinet/history/history.module';

@Module({
  imports: [TypeOrmModule.forFeature([GroupKit, DonateGroup, Period, Server, User, UsersDonateGroup]), HistoryModule],
  providers: [DonateGroupsService, GroupKitsService],
  exports: [DonateGroupsService],
  controllers: [GroupKitsController, DonateGroupsController],
})
export class DonateGroupsModule {}
