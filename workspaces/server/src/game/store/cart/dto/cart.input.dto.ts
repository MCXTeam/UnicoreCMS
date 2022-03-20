import { IsDefined, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { PayloadType } from "../../dto/paginated-store.dto";

export class CartInput {
  @IsDefined()
  @IsInt()
  id: number

  @IsDefined()
  @IsEnum(PayloadType)
  type: PayloadType
  
  @IsDefined()
  @IsString()
  server_id: string
  
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  amount?: number
}