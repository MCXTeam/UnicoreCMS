import { IsBoolean, IsDefined, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, TOTP_CODE_MAX_LENGTH } from '@common';
import { GravitContext } from './gravit-refresh-token.input';

export class FirstPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  type?: string;
}

export class SecondPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(TOTP_CODE_MAX_LENGTH)
  totp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  type?: string;
}

export class GravitPassword {
  @IsOptional()
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  type?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FirstPasswordDto)
  firstPassword?: FirstPasswordDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SecondPasswordDto)
  secondPassword?: SecondPasswordDto;
}

export class GravitAuthorize {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  login: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GravitContext)
  context?: GravitContext;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => GravitPassword)
  password: GravitPassword;

  @IsBoolean()
  minecraftAccess: boolean;
}
