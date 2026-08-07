import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@common';

export class NewsInput {
  @IsDefined()
  @IsString()
  title: string;

  @IsDefined()
  @IsString()
  @SanitizeHtml()
  description: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  short_description?: string;

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
