import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PasswordResetInput {
  @IsDefined()
  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  password?: string;

  @IsOptional()
  @IsBoolean()
  close: boolean
}
