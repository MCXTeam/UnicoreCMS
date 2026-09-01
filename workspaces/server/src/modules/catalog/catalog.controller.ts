import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { EXTENSION_KINDS, ExtensionKind } from 'unicore-common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { ExtensionCatalogService } from './catalog.service';
import { CatalogInstallInput, InstallUrlInput } from './dto/catalog-install.input';
import { ExtensionSourceInput } from './dto/extension-source.input';
import { ExtensionSourcesService } from './sources.service';

@Controller('admin/extensions')
@Permissions(['panel.extensions.manage'])
export class ExtensionCatalogController {
  constructor(private readonly catalog: ExtensionCatalogService, private readonly sources: ExtensionSourcesService) {}

  @Permissions(['panel.extensions.read'])
  @Get('catalog')
  list(@Query('kind') kind: string, @Query('refresh') refresh?: string) {
    if (!EXTENSION_KINDS.includes(kind as ExtensionKind)) throw new BadRequestException('Неизвестный тип расширения');

    return this.catalog.catalog(kind as ExtensionKind, refresh === '1');
  }

  @Post('catalog/install')
  installFromCatalog(@Body() input: CatalogInstallInput) {
    return this.catalog.installFromCatalog(input);
  }

  @Post('url')
  installFromUrl(@Body() input: InstallUrlInput) {
    return this.catalog.installFromUrl(input);
  }

  @Get('sources')
  listSources() {
    return this.sources.list();
  }

  @Post('sources')
  createSource(@Body() input: ExtensionSourceInput) {
    return this.sources.create(input);
  }

  @Patch('sources/:id')
  updateSource(@Param('id', ParseIntPipe) id: number, @Body() input: ExtensionSourceInput) {
    return this.sources.update(id, input);
  }

  @Delete('sources/:id')
  removeSource(@Param('id', ParseIntPipe) id: number) {
    return this.sources.remove(id);
  }
}
