import { IsDefined, IsInt, IsOptional, IsString } from 'class-validator';

export class CategoryInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsInt()
  priority: number;
}
