import { IsStrongPassword, IsUsername } from '@common';
import { LOCALE_CODE_PATTERN } from 'unicore-common';
import { IsArray, IsBoolean, IsDefined, IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class UserInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @IsStrongPassword()
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
