import { TOTP_CODE_MAX_LENGTH } from '@common';
import { IsDefined, IsString, MaxLength } from 'class-validator';

export class TwoFactorInput {
  @IsDefined()
  @IsString()
  @MaxLength(TOTP_CODE_MAX_LENGTH)
  code: string;
}
