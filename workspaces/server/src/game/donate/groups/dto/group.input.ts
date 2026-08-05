import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { GroupFeatureInput } from './group-feature.input';
import { IsDonateWebPerm, PRICE_MIN, SanitizeHtml } from '@common';

export class GroupInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsString()
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
  @ValidateNested({ each: true })
  @Type(() => GroupFeatureInput)
  features: GroupFeatureInput[];

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  servers: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsDonateWebPerm({ each: true })
  web_perms: string[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  kits: number[];

  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  periods: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtual_percent?: number;
}
