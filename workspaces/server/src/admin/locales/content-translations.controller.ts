import { Body, Controller, ForbiddenException, Get, Param, Patch, Req } from '@nestjs/common';
import { Permission } from 'unicore-common';
import { RuntimePermissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { translationAccess } from './translatable.decorator';
import { ContentTranslationsService } from './content-translations.service';
import { ContentTranslationsInput } from './dto/content-translations.input';

@RuntimePermissions()
@Controller('content-translations')
export class ContentTranslationsController {
  constructor(private contentTranslations: ContentTranslationsService) {}

  private async assertAccess(request: any, entity: string, mode: 'read' | 'write'): Promise<void> {
    const permissions = translationAccess(entity, mode);

    if (!permissions.length) throw new ForbiddenException();

    if (!(await matchPermission([Permission.AdminDashboard], request))) throw new ForbiddenException();

    if (!(await matchPermission([permissions, { or: true }], request))) throw new ForbiddenException();
  }

  @Get(':entity/:id')
  async find(@Req() request: any, @Param('entity') entity: string, @Param('id') id: string) {
    await this.assertAccess(request, entity, 'read');

    return this.contentTranslations.find(entity, id);
  }

  @Patch(':entity/:id')
  async save(@Req() request: any, @Param('entity') entity: string, @Param('id') id: string, @Body() body: ContentTranslationsInput) {
    await this.assertAccess(request, entity, 'write');

    return this.contentTranslations.save(entity, id, body.translations);
  }
}
