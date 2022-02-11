import { IsDefined, IsPort, IsString } from "class-validator";

export class QueryInput {
  @IsDefined()
  @IsString()
  host: string

  @IsDefined()
  @IsPort()
  port: number
}