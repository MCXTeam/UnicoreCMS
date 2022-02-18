import { IsArray, IsDefined, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PermissionType } from '../enums/permission-type.enum';

export class PermissionInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsEnum(PermissionType)
  type: PermissionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDefined()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sale: number;

  @IsDefined()
  @IsArray()
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
  web_perms?: string[];
}
