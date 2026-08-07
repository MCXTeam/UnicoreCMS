import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentTranslation } from './entities/content-translation.entity';
import { Locale } from './entities/locale.entity';
import { Translation } from './entities/translation.entity';
import { ContentTranslationsController } from './content-translations.controller';
import { ContentTranslationsService } from './content-translations.service';
import { ContentTranslationsSubscriber } from './content-translations.subscriber';
import { LocalesController } from './locales.controller';
import { LocalesService } from './locales.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Locale, Translation, ContentTranslation])],
  providers: [LocalesService, ContentTranslationsService, ContentTranslationsSubscriber],
  controllers: [LocalesController, ContentTranslationsController],
  exports: [LocalesService, ContentTranslationsService],
})
export class LocalesModule implements OnModuleInit {
  constructor(private localesService: LocalesService) {}

  async onModuleInit() {
    await this.localesService.init();
  }
}
