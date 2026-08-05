import { IsDefined, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GroupFeatureInput {
  @IsDefined()
  @IsInt()
  @Min(0)
  priority: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
