import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { SuperUserGuard } from '../roles/guards/superuser.guard';
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

  @UseGuards(SuperUserGuard)
  @Get('all')
  findAll() {
    return this.localesService.find();
  }

  @UseGuards(SuperUserGuard)
  @Get('keys')
  keys() {
    return this.localesService.keys();
  }

  @Public()
  @Get(':code/messages')
  messages(@Param('code') code: string) {
    return this.localesService.messages(code);
  }

  @UseGuards(SuperUserGuard)
  @Post()
  create(@Body() body: LocaleInput) {
    return this.localesService.create(body);
  }

  @UseGuards(SuperUserGuard)
  @Patch(':code')
  update(@Param('code') code: string, @Body() body: LocaleInput) {
    return this.localesService.update(code, body);
  }

  @UseGuards(SuperUserGuard)
  @Patch(':code/messages')
  saveTranslations(@Param('code') code: string, @Body() body: TranslationsInput) {
    return this.localesService.saveTranslations(code, body);
  }

  @UseGuards(SuperUserGuard)
  @Delete('keys/:key')
  removeKey(@Param('key') key: string) {
    return this.localesService.removeKey(key);
  }

  @UseGuards(SuperUserGuard)
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.localesService.remove(code);
  }
}
