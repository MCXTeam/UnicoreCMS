import { IsDefined, IsInt, IsString } from "class-validator";

export class GroupBuyInput {
  @IsDefined()
  @IsInt()
  group: number

  @IsDefined()
  @IsString()
  server: string

  @IsDefined()
  @IsInt()
  period: number
}