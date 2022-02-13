import { IsDefined, IsInt, IsNumber, IsString } from "class-validator"

export class PeriodInput {
  @IsDefined()
  @IsString()
  name: string

  @IsDefined()
  @IsInt()
  expire: number

  @IsDefined()
  @IsNumber()
  multiplier: number
}