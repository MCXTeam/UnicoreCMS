import { Module } from '@nestjs/common';
import { SkinService } from './skin.service';
import { SkinController } from './skin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Skin } from './entities/skin.entity';
import { Cloak } from './entities/cloak.entity';
import UsersModule from 'src/admin/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Skin, Cloak]), UsersModule],
  providers: [SkinService],
  controllers: [SkinController],
})
export class SkinModule {}
