import { IsDefined, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@common';

export class PageInput {
  @IsDefined()
  @IsString()
  title: string;

  @IsDefined()
  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  content: string;

  @IsOptional()
  @IsString()
  custom_css?: string;

  @IsOptional()
  @IsString()
  custom_js?: string;
}
