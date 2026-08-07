import { IsUsername, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@common';
import { LOCALE_CODE_PATTERN } from 'unicore-common';
import { IsArray, IsBoolean, IsDefined, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UserInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @IsOptional()
  @IsString()
  @Matches(LOCALE_CODE_PATTERN)
  locale?: string;

  @IsOptional()
  @IsBoolean()
  superuser?: boolean;

  @IsOptional()
  @IsBoolean()
  activated?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perms?: string[];
}
