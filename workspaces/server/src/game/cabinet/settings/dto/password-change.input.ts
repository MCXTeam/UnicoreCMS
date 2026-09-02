import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';
import { IsStrongPassword } from '@common';

export class PasswordChangeInput {
  @IsDefined()
  @IsString()
  password_old: string;

  @IsDefined()
  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsBoolean()
  close: boolean;
}
