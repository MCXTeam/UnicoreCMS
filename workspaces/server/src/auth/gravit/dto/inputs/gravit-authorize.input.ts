import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class Password {
  @IsString()
  password: string;
  @IsString()
  type: string;
}

export class FirstPasswordDto {
  @IsString()
  password: string;

  @IsString()
  type: string;
}

export class SecondPasswordDto {
  @IsString()
  totp: string;

  @IsString()
  type: string;
}

export class Password2FA {
  @ValidateNested()
  @Type(() => FirstPasswordDto)
  firstPassword: FirstPasswordDto;

  @ValidateNested()
  @Type(() => SecondPasswordDto)
  secondPassword: SecondPasswordDto;
}

export class GravitAuthorize {
  @IsString()
  login: string;
  @IsOptional()
  @IsObject()
  context?: {
    ip: string;
  };
  @IsObject()
  password: Password | Password2FA;
  @IsBoolean()
  minecraftAccess: boolean;
}
