import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRecord } from './entities/module.entity';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { InstallController } from './install/install.controller';
import { InstallService } from './install/install.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleRecord])],
  controllers: [ModulesController, InstallController],
  providers: [ModulesService, InstallService],
  exports: [ModulesService],
})
export class ModulesModule {}
