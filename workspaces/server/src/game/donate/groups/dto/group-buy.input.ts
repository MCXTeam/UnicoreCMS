import { IsBoolean, IsDefined, IsInt, IsOptional, IsString } from 'class-validator';

export class GroupBuyInput {
  @IsDefined()
  @IsInt()
  group: number;

  @IsDefined()
  @IsString()
  server: string;

  @IsDefined()
  @IsInt()
  period: number;

  @IsOptional()
  @IsBoolean()
  use_virtual: boolean
}
