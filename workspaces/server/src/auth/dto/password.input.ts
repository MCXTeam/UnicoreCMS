import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator';

export class PasswordInput {
  @IsDefined()
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  password: string;
}
