import { IsDefined, IsInt, IsString } from "class-validator"

export class GiveDonateGroupInput {
  @IsDefined()
  @IsString()
  user_uuid: string 

  @IsDefined()
  @IsString()
  server_id: string 

  @IsDefined()
  @IsInt()
  group_id: number 

  @IsDefined()
  @IsInt()
  period_id: number 
}