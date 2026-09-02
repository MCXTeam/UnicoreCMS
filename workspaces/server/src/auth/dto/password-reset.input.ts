import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword, PASSWORD_RESET_HASH_LENGTH } from '@common';

export class PasswordResetInput {
  @IsDefined()
  @IsString()
  @MaxLength(PASSWORD_RESET_HASH_LENGTH)
  hash: string;

  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;
}
