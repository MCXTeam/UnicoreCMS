import { CART_AMOUNT_MAX, CART_AMOUNT_MIN, SERVER_ID_MAX_LENGTH } from '@common';
import { IsDefined, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PayloadType } from '../../dto/paginated-store.dto';

export class CartInput {
  @IsDefined()
  @IsInt()
  id: number;

  @IsDefined()
  @IsEnum(PayloadType)
  type: PayloadType;

  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  server_id: string;

  @IsOptional()
  @IsInt()
  @Min(CART_AMOUNT_MIN)
  @Max(CART_AMOUNT_MAX)
  amount?: number;
}
