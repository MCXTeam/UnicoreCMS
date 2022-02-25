import { Module } from '@nestjs/common';
import { SkinService } from './skin.service';
import { SkinController } from './skin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Skin } from './entities/skin.entity';
import { Cloak } from './entities/cloak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Skin, Cloak])],
  providers: [SkinService],
  controllers: [SkinController],
})
export class SkinModule {}
