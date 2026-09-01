import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsEnum, IsHexColor, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RoleBadgeEffect } from 'unicore-common';

export class RoleUpdateInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  perms: string[];

  @IsDefined()
  @IsInt()
  priority: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  referal_percent?: number;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  staff?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  badge?: boolean;

  @IsOptional()
  @IsHexColor()
  badge_color?: string;

  @IsOptional()
  @IsHexColor()
  badge_background?: string;

  @IsOptional()
  @IsHexColor()
  badge_background_end?: string;

  @IsOptional()
  @IsEnum(RoleBadgeEffect)
  badge_effect?: RoleBadgeEffect;
}
