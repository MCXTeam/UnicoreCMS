import { IsDefined, IsNumber, IsString } from "class-validator"

export class MoneyPayCommandInput {
  @IsDefined()
  @IsString()
  server_id: string

  @IsDefined()
  @IsString()
  user_uuid: string

  @IsDefined()
  @IsString()
  user_ip: string

  @IsDefined()
  @IsString()
  target_uuid: string

  @IsDefined()
  @IsNumber()
  amount: number
}