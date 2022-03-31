import { IsDefined, IsNumber, IsString } from "class-validator"

export class MoneyWDInput {
  @IsDefined()
  @IsString()
  server_id: string

  @IsDefined()
  @IsString()
  user_uuid: string

  @IsDefined()
  @IsNumber()
  amount: number
}