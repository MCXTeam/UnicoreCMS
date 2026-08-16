import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { NAME_MAX_LENGTH, PATH_MAX_LENGTH, PATH_PATTERN, SanitizeHtml, TEXT_MAX_LENGTH } from '@common';

export class PageInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  title: string;

  @IsDefined()
  @IsString()
  @MaxLength(PATH_MAX_LENGTH)
  @Matches(PATH_PATTERN)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
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
