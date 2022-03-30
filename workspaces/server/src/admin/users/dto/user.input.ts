import { IsUsername } from '@common';
import { IsArray, IsBoolean, IsDefined, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UserInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  password: string;

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
