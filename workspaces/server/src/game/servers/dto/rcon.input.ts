import { IsDefined, IsInt, IsString, Max, Min } from 'class-validator';

export class RconInput {
  @IsDefined()
  @IsString()
  host: string;

  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;

  @IsDefined()
  @IsString()
  password: string;
}
