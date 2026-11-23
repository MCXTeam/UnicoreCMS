import { Audit } from '@common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { ModuleStateInput } from './dto/module-state.input';
import { RebuildInput } from './dto/rebuild.input';
import { ModulesService } from './modules.service';
import { REBUILD_SIDES, RebuildService } from './rebuild.service';
import { ConfigService } from '../admin/config/config.service';
import { matchPermission } from '../admin/roles/guards/permisson.guard';
import { SettingsInput } from '../admin/config/dto/settings.input';

@Controller('admin/modules')
@Permissions(['panel.extensions.read'])
export class ModulesController {
  constructor(
    private readonly service: ModulesService,
    private readonly rebuild: RebuildService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Get('rebuild')
  rebuildStatus() {
    return this.rebuild.status();
  }

  @Permissions(['panel.extensions.manage'])
  @Audit({ action: 'theme.rebuild', meta: ['sides'] })
  @Post('rebuild')
  rebuildStart(@Body() input: RebuildInput) {
    return this.rebuild.start(input.sides?.length ? input.sides : REBUILD_SIDES);
  }

  @Permissions(['panel.extensions.manage'])
  @Delete('rebuild')
  rebuildStop() {
    return this.rebuild.stop();
  }

  @Get(':id/settings')
  settings(@Param('id') id: string) {
    return this.service.settings(id);
  }

  @Get(':id/settings/catalog')
  settingsCatalog(@Param('id') id: string) {
    return this.config.settings(id);
  }

  @Permissions(['panel.extensions.manage'])
  @Audit({ action: 'config.update', target: 'module', param: 'id' })
  @Patch(':id/settings')
  async saveSettings(@Param('id') id: string, @Body() input: SettingsInput, @Req() request: unknown) {
    const catalog = await this.config.saveSettings(input.changes, id);
    if (!(await matchPermission(['panel.extensions.read'], request))) {
      const changedKeys = new Set(input.changes.map((change) => change.key));
      catalog.fields = catalog.fields.filter((field) => changedKeys.has(field.key));
      catalog.categories = catalog.categories.filter((category) => catalog.fields.some((field) => field.category === category.id));
    }
    return catalog;
  }

  @Permissions(['panel.extensions.manage'])
  @Audit({ action: 'module.enable', target: 'module', param: 'id', meta: ['enabled'] })
  @Patch(':id')
  setEnabled(@Param('id') id: string, @Body() input: ModuleStateInput) {
    return this.service.setEnabled(id, input.enabled);
  }

  @Permissions(['panel.extensions.manage'])
  @Audit({ action: 'module.remove', target: 'module', param: 'id' })
  @Delete(':id')
  purge(@Param('id') id: string, @Query('purge') purge?: string) {
    if (purge !== '1') return { purged: false };

    return this.service.purge(id).then(() => ({ purged: true }));
  }
}
