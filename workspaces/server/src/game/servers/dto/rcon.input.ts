import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PORT_MAX, PORT_MIN } from '@common';
import { IsDefined, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RconInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  host: string;

  @IsDefined()
  @IsInt()
  @Min(PORT_MIN)
  @Max(PORT_MAX)
  port: number;

  @IsOptional()
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password?: string;
}
