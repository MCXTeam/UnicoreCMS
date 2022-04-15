import { IsDefined, IsOptional, IsString } from 'class-validator';

export class ModInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  description: string;
}
