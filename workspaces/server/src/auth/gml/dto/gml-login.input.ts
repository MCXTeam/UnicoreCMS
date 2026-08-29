import { IsUsernameOrEmail, PASSWORD_MAX_LENGTH, TOTP_CODE_MAX_LENGTH } from '@common';
import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class GmlLoginInput {
  @IsDefined()
  @IsUsernameOrEmail()
  Login: string;

  @IsDefined()
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  Password: string;

  @IsOptional()
  @IsString()
  @MaxLength(TOTP_CODE_MAX_LENGTH)
  Totp: string;
}
