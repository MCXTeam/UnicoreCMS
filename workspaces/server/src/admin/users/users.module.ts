import { forwardRef, Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from '../roles/entities/role.entity';
import { PlaytimeModule } from 'src/game/cabinet/playtime/playtime.module';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { ReferalsModule } from 'src/game/cabinet/referals/referals.module';
import { SettingsModule } from 'src/game/cabinet/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Vote]), 
    forwardRef(() => PlaytimeModule), forwardRef(() => ReferalsModule),
    SettingsModule
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export default class UsersModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    await this.usersService.genKernel();
  }
}
