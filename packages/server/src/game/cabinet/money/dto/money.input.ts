import { IsDefined, IsNumber, IsString, Min } from "class-validator"

export class MoneyInput {
  @IsDefined()
  @IsString()
  user: string

  @IsDefined()
  @IsString()
  server: string

  @IsDefined()
  @IsNumber()
  @Min(0)
  money: number
}