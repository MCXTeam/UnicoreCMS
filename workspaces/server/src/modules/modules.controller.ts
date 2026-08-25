import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SuperUserGuard } from 'src/admin/roles/guards/superuser.guard';
import { ModuleStateInput } from './dto/module-state.input';
import { RebuildInput } from './dto/rebuild.input';
import { ModulesService } from './modules.service';
import { REBUILD_SIDES, RebuildService } from './rebuild.service';

@Controller('admin/modules')
@UseGuards(SuperUserGuard)
export class ModulesController {
  constructor(private readonly service: ModulesService, private readonly rebuild: RebuildService) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Get('rebuild')
  rebuildStatus() {
    return this.rebuild.status();
  }

  @Post('rebuild')
  rebuildStart(@Body() input: RebuildInput) {
    return this.rebuild.start(input.sides?.length ? input.sides : REBUILD_SIDES);
  }

  @Delete('rebuild')
  rebuildStop() {
    return this.rebuild.stop();
  }

  @Get(':id/settings')
  settings(@Param('id') id: string) {
    return this.service.settings(id);
  }

  @Patch(':id')
  setEnabled(@Param('id') id: string, @Body() input: ModuleStateInput) {
    return this.service.setEnabled(id, input.enabled);
  }

  @Delete(':id')
  purge(@Param('id') id: string, @Query('purge') purge?: string) {
    if (purge !== '1') return { purged: false };

    return this.service.purge(id).then(() => ({ purged: true }));
  }
}
