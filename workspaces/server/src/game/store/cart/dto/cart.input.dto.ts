import { IsDefined, IsInt, IsString, Max, Min } from "class-validator";

export class CartInput {
  @IsDefined()
  @IsInt()
  product_id: number
  
  @IsDefined()
  @IsString()
  server_id: string
  
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(10000)
  amount: number
}