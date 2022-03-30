import { IsUsername } from '@common';
import { IsArray, IsBoolean, IsDefined, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UserUpdateInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
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
