import { IsDefined, IsInt, IsOptional, IsString } from "class-validator"

export class GiveDonatePermInput {
  @IsDefined()
  @IsString()
  user_uuid: string 

  @IsOptional()
  @IsString()
  server_id: string 

  @IsDefined()
  @IsInt()
  permission_id: number 

  @IsDefined()
  @IsInt()
  period_id: number 
}