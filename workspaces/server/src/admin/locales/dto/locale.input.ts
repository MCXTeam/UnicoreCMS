import { IsBoolean, IsDefined, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { LOCALE_CODE_PATTERN } from 'unicore-common';

export class LocaleInput {
  @IsDefined()
  @IsString()
  @Matches(LOCALE_CODE_PATTERN)
  code: string;

  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}
