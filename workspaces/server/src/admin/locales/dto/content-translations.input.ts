import { IsObject, IsOptional } from 'class-validator';
import { TranslationsPayload } from '../content-translations.service';

export class ContentTranslationsInput {
  @IsOptional()
  @IsObject()
  translations?: TranslationsPayload;
}
