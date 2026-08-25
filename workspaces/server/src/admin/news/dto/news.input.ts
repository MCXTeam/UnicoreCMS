import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDefined, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { BULK_ITEMS_MAX, CUSTOM_CODE_MAX_LENGTH, NAME_MAX_LENGTH, SanitizeHtml, toIdList } from '@common';

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
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(CUSTOM_CODE_MAX_LENGTH)
  custom_css?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CUSTOM_CODE_MAX_LENGTH)
  custom_js?: string;

  @IsOptional()
  @Transform(({ value }) => toIdList(value))
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  webhooks?: number[];
}
