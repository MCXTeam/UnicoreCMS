import { IsUsernameOrEmail } from '@common';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class LoginInput {
  @IsDefined()
  @IsUsernameOrEmail()
  username_or_email: string;

  @IsDefined()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  totp: string;
}
