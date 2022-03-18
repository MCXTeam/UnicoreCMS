import { IsDefined, IsInt, IsString } from "class-validator";

export class CartInput {
  @IsDefined()
  @IsInt()
  product_id: number
  
  @IsDefined()
  @IsString()
  server_id: string
  
  @IsDefined()
  @IsInt()
  amount: number
}