import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRecord } from './entities/module.entity';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { InstallController } from './install/install.controller';
import { InstallService } from './install/install.service';
import { RebuildService } from './rebuild.service';
import { ExtensionCatalogController } from './catalog/catalog.controller';
import { ExtensionCatalogService } from './catalog/catalog.service';
import { ExtensionDownloadService } from './catalog/download.service';
import { ExtensionSourcesService } from './catalog/sources.service';
import { ExtensionSource } from './catalog/entities/extension-source.entity';
import { LicenseController } from './licensing/license.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleRecord, ExtensionSource])],
  controllers: [ModulesController, ExtensionCatalogController, InstallController, LicenseController],
  providers: [ModulesService, InstallService, RebuildService, ExtensionSourcesService, ExtensionDownloadService, ExtensionCatalogService],
  exports: [ModulesService],
})
export class ModulesModule {}
