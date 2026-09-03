import { Audit } from '@common';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from '../roles/decorators/permission.decorator';
import { LocaleInput } from './dto/locale.input';
import { TranslationsInput } from './dto/translations.input';
import { LocalesService } from './locales.service';

@Controller('locales')
export class LocalesController {
  constructor(private localesService: LocalesService) {}

  @Public()
  @Get()
  find() {
    return this.localesService.findEnabled();
  }

  @Permissions(['panel.locales.read'])
  @Get('all')
  findAll() {
    return this.localesService.find();
  }

  @Permissions(['panel.locales.read'])
  @Get('keys')
  keys() {
    return this.localesService.keys();
  }

  @Public()
  @Get(':code/messages')
  messages(@Param('code') code: string) {
    return this.localesService.messages(code);
  }

  @Permissions(['panel.locales.manage'])
  @Audit({ action: 'content.create', target: 'locale' })
  @Post()
  create(@Body() body: LocaleInput) {
    return this.localesService.create(body);
  }

  @Permissions(['panel.locales.manage'])
  @Audit({ action: 'content.update', target: 'locale', param: 'code' })
  @Patch(':code')
  update(@Param('code') code: string, @Body() body: LocaleInput) {
    return this.localesService.update(code, body);
  }

  @Permissions(['panel.locales.update'])
  @Audit({ action: 'content.update', target: 'locale', param: 'code' })
  @Patch(':code/messages')
  saveTranslations(@Param('code') code: string, @Body() body: TranslationsInput) {
    return this.localesService.saveTranslations(code, body);
  }

  @Permissions(['panel.locales.update'])
  @Audit({ action: 'content.delete', target: 'locale', param: 'key' })
  @Delete('keys/:key')
  removeKey(@Param('key') key: string) {
    return this.localesService.removeKey(key);
  }

  @Permissions(['panel.locales.manage'])
  @Audit({ action: 'content.delete', target: 'locale', param: 'code' })
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.localesService.remove(code);
  }
}
