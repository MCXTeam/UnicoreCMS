import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UsersModule from 'src/admin/users/users.module';
import { NewsModule } from 'src/admin/news/news.module';
import { SettingsModule } from 'src/game/cabinet/settings/settings.module';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { AuthModule } from '../auth.module';
import { PasswordModule } from '../password/password.module';
import { LaminaraController } from './laminara.controller';
import { LaminaraService } from './laminara.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersDonateGroup, UsersDonatePermission]),
    UsersModule,
    AuthModule,
    PasswordModule,
    SettingsModule,
    NewsModule,
  ],
  providers: [LaminaraService],
  controllers: [LaminaraController],
})
export class LaminaraModule {}
