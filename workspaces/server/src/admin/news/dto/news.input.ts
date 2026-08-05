import { IsDefined, IsString } from 'class-validator';
import { SanitizeHtml } from '@common';

export class NewsInput {
  @IsDefined()
  @IsString()
  title: string;

  @IsDefined()
  @IsString()
  @SanitizeHtml()
  description: string;
}
