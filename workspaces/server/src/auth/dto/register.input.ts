import { IsUsername, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@common';
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
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @IsOptional()
  @IsUsername()
  ref: string;
}
