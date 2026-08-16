import { NAME_MAX_LENGTH, TEXT_MAX_LENGTH } from '@common';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ServerTableInput {
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  description?: string;
}
