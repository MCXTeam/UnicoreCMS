import { IsBoolean, IsDefined, IsInt, IsOptional, IsString } from 'class-validator';

export class PermissionBuyInput {
  @IsDefined()
  @IsInt()
  permission: number;

  @IsOptional()
  @IsString()
  server: string;

  @IsDefined()
  @IsInt()
  period: number;

  @IsOptional()
  @IsBoolean()
  use_virtual: boolean
}
