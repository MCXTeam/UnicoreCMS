import { Module } from '@nestjs/common';
import { GravitService } from './gravit.service';
import { GravitController } from './gravit.controller';
import UsersModule from 'src/admin/users/users.module';
import { AuthModule } from '../auth.module';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'unicore-common';
import { SettingsModule } from 'src/game/cabinet/settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    SettingsModule,
    JwtModule.register({
      secret: envConfig.jwtKey,
      signOptions: { expiresIn: envConfig.jwtExpires },
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  providers: [GravitService],
  controllers: [GravitController],
  exports: [GravitService],
})
export class GravitModule {}
