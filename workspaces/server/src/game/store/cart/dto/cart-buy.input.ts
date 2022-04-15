import { IsBoolean, IsDefined, IsOptional, IsString } from "class-validator";

export class CartBuyInput {
  @IsDefined()
  @IsString()
  server_id: string

  @IsOptional()
  @IsBoolean()
  use_virtual: boolean
}