import { IsDefined, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_RESET_HASH_LENGTH } from '@common';

export class PasswordResetInput {
  @IsDefined()
  @IsString()
  @MaxLength(PASSWORD_RESET_HASH_LENGTH)
  hash: string;

  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password?: string;
}
