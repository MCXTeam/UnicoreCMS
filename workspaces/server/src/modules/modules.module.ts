import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRecord } from './entities/module.entity';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { InstallController } from './install/install.controller';
import { InstallService } from './install/install.service';
import { RebuildService } from './rebuild.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleRecord])],
  controllers: [ModulesController, InstallController],
  providers: [ModulesService, InstallService, RebuildService],
  exports: [ModulesService],
})
export class ModulesModule {}
