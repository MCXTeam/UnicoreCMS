import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';
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
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  full_size?: boolean;

  @IsOptional()
  @IsString()
  custom_css?: string;

  @IsOptional()
  @IsString()
  custom_js?: string;
}
