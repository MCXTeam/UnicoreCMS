import { IsDefined, IsNumber, IsOptional, IsString } from "class-validator";

export class BanInput {
  @IsDefined()
  @IsString()
  user_uuid: string

  @IsOptional()
  @IsString()
  actor_uuid?: string

  @IsOptional()
  @IsNumber()
  expires?: number;

  @IsDefined()
  @IsString()
  reason: string
}