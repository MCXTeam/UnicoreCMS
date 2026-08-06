import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@common';

export class PasswordChangeInput {
  @IsDefined()
  @IsString()
  password_old: string;

  @IsDefined()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @IsOptional()
  @IsBoolean()
  close: boolean;
}
