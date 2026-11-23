import { Audit } from '@common';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { isRconConfigKey } from 'unicore-common';
import { Public } from 'src/auth/decorators/public.decorator';
import { RuntimePermissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { ConfigService } from './config.service';
import { ConfigInput } from './dto/config.input';
import { SettingsInput } from './dto/settings.input';

@RuntimePermissions()
@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  private async rconOnly(request: unknown, permission: 'panel.config.read' | 'panel.config.update'): Promise<boolean> {
    if (await matchPermission([permission], request)) return false;

    if (await matchPermission(['panel.servers.issuance'], request)) return true;

    throw new ForbiddenException();
  }

  private async assertConfigUpdate(request: unknown): Promise<void> {
    if (!(await matchPermission(['panel.config.update'], request))) throw new ForbiddenException();
  }

  @Public()
  @Get('/public')
  findPublic() {
    return this.configService.findPublic();
  }

  @Get()
  async find(@Req() request: unknown) {
    const limited = await this.rconOnly(request, 'panel.config.read');
    const config = await this.configService.find();

    return limited ? config.filter((item) => isRconConfigKey(item.key)) : config;
  }

  @Get('settings')
  async settings(@Req() request: unknown) {
    const limited = await this.rconOnly(request, 'panel.config.read');
    const catalog = await this.configService.settings();
    if (!limited) return catalog;
    catalog.fields = catalog.fields.filter((field) => isRconConfigKey(field.key));
    catalog.categories = catalog.categories.filter((category) => catalog.fields.some((field) => field.category === category.id));
    return catalog;
  }

  @Audit({ action: 'config.update' })
  @Patch('settings')
  async saveSettings(@Req() request: unknown, @Body() body: SettingsInput) {
    const limited = await this.rconOnly(request, 'panel.config.update');
    if (limited && body.changes.some((change) => !isRconConfigKey(change.key))) throw new ForbiddenException();
    const catalog = await this.configService.saveSettings(body.changes);
    if (limited || !(await matchPermission(['panel.config.read'], request))) {
      const changedKeys = new Set(body.changes.map((change) => change.key));
      catalog.fields = catalog.fields.filter((field) => (limited ? isRconConfigKey(field.key) : changedKeys.has(field.key)));
      catalog.categories = catalog.categories.filter((category) => catalog.fields.some((field) => field.category === category.id));
    }
    return catalog;
  }

  @Audit({ action: 'config.update' })
  @Patch()
  async update(@Req() request: unknown, @Body() body: ConfigInput) {
    if ((await this.rconOnly(request, 'panel.config.update')) && !isRconConfigKey(body.key)) throw new ForbiddenException();

    return this.configService.update(body);
  }

  @Audit({ action: 'config.delete', target: 'config', param: 'key' })
  @Delete(':key')
  async delete(@Req() request: unknown, @Param('key') key: string) {
    await this.assertConfigUpdate(request);

    return this.configService.remove(key);
  }

  @Audit({ action: 'config.create', target: 'config', bodyParam: 'key' })
  @Post()
  async create(@Req() request: unknown, @Body() body: ConfigInput) {
    await this.assertConfigUpdate(request);

    return this.configService.create(body);
  }
}
