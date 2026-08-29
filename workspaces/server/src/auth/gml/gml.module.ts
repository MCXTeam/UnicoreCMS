import { Module } from '@nestjs/common';
import { GmlController } from './gml.controller';
import { GmlService } from './gml.service';
import UsersModule from 'src/admin/users/users.module';
import { AuthModule } from '../auth.module';
import { PasswordModule } from '../password/password.module';
import { SettingsModule } from 'src/game/cabinet/settings/settings.module';

@Module({
  imports: [UsersModule, AuthModule, PasswordModule, SettingsModule],
  providers: [GmlService],
  controllers: [GmlController],
})
export class GmlModule {}
