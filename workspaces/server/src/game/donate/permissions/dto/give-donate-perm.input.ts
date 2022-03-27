import { IsDefined, IsInt, IsString } from "class-validator"

export class GiveDonatePermInput {
  @IsDefined()
  @IsString()
  user_uuid: string 

  @IsDefined()
  @IsString()
  server_id: string 

  @IsDefined()
  @IsInt()
  permission_id: number 

  @IsDefined()
  @IsInt()
  period_id: number 
}