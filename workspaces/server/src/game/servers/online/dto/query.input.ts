import { NAME_MAX_LENGTH, PORT_MAX, PORT_MIN } from '@common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryInput {
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  host?: string;

  @IsOptional()
  @IsInt()
  @Min(PORT_MIN)
  @Max(PORT_MAX)
  port?: number;
}
