import { IsUsernameOrEmail, PASSWORD_MAX_LENGTH, TOTP_CODE_MAX_LENGTH } from '@common';
import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class LaminaraAuthenticateInput {
  @IsDefined()
  @IsUsernameOrEmail()
  login: string;

  @IsDefined()
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(TOTP_CODE_MAX_LENGTH)
  totp?: string;
}
