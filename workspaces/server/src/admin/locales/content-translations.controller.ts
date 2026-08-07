import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SuperUserGuard } from '../roles/guards/superuser.guard';
import { ContentTranslationsService } from './content-translations.service';
import { ContentTranslationsInput } from './dto/content-translations.input';

@UseGuards(SuperUserGuard)
@Controller('content-translations')
export class ContentTranslationsController {
  constructor(private contentTranslations: ContentTranslationsService) {}

  @Get(':entity/:id')
  find(@Param('entity') entity: string, @Param('id') id: string) {
    return this.contentTranslations.find(entity, id);
  }

  @Patch(':entity/:id')
  save(@Param('entity') entity: string, @Param('id') id: string, @Body() body: ContentTranslationsInput) {
    return this.contentTranslations.save(entity, id, body.translations);
  }
}
