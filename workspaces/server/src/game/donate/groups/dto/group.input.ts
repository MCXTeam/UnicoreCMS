import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsHexColor,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { GroupFeatureInput } from './group-feature.input';
import { BULK_ITEMS_MAX, IsPlayerPerm, NAME_MAX_LENGTH, PRICE_MIN, SanitizeHtml, SERVER_ID_MAX_LENGTH } from '@common';

export class GroupInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  ingame_id: string;

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

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => GroupFeatureInput)
  features: GroupFeatureInput[];

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @MaxLength(SERVER_ID_MAX_LENGTH, { each: true })
  servers: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsString({ each: true })
  @IsPlayerPerm({ each: true })
  web_perms: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  web_role_id?: string;

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  kits: number[];

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  periods: number[];

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

  @IsOptional()
  @IsBoolean()
  staff?: boolean;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
