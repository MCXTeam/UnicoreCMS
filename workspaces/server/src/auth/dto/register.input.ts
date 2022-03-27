import { IsUsername } from '@common';
import { IsDefined, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  password: string;

  @IsOptional()
  ref: string;
}
