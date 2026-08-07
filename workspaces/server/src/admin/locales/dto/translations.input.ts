import { IsDefined, IsObject } from 'class-validator';

export class TranslationsInput {
  @IsDefined()
  @IsObject()
  messages: Record<string, string>;
}
