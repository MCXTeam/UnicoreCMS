import { IsStrongPassword, IsUsername } from '@common';
import { IsDefined, IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsUsername()
  ref: string;
}
