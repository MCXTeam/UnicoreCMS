import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

export class PasswordChangeInput {
  @IsDefined()
  @IsString()
  password_old: string

  @IsDefined()
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  password: string

  @IsOptional()
  @IsBoolean()
  close: boolean
}