import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { CUSTOM_CODE_MAX_LENGTH, NAME_MAX_LENGTH, SanitizeHtml } from '@common';

export class NewsInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
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
  @MaxLength(CUSTOM_CODE_MAX_LENGTH)
  custom_css?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CUSTOM_CODE_MAX_LENGTH)
  custom_js?: string;
}
