import { NAME_MAX_LENGTH, PORT_MAX, PORT_MIN } from '@common';
import { IsDefined, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ServerInstanceInput {
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  host: string;

  @IsOptional()
  @IsInt()
  @Min(PORT_MIN)
  @Max(PORT_MAX)
  port?: number;
}
