import { Type } from 'class-transformer';
import { IsDefined, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { IP_MAX_LENGTH, TOKEN_MAX_LENGTH } from '@common';

export class GravitContext {
  @IsOptional()
  @IsString()
  @MaxLength(IP_MAX_LENGTH)
  ip?: string;
}

export class GravitRefreshToken {
  @IsDefined()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  refreshToken: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GravitContext)
  context?: GravitContext;
}
