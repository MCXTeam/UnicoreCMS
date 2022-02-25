import { IsDefined, IsOptional, IsString } from 'class-validator';

export class ServerTableDto {
  @IsDefined()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;
}
