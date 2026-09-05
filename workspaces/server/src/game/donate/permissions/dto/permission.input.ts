import { ArrayMinSize, IsArray, IsBoolean, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, MaxLength, ValidateIf } from 'class-validator';
import { PermissionType } from '../enums/permission-type.enum';
import { IsPlayerPerm, PRICE_MIN, SanitizeHtml } from '@common';

export class PermissionInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsEnum(PermissionType)
  type: PermissionType;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;

  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @ValidateIf((input: PermissionInput) => input.type !== PermissionType.Web)
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  servers?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  kits?: number[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  periods: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsPlayerPerm({ each: true })
  web_perms?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  web_role_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtual_percent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  referal_percent?: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsBoolean()
  giftable?: boolean;

  @IsOptional()
  @IsBoolean()
  regiftable?: boolean;
}
