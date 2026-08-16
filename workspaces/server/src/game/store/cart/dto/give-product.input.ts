import { CART_AMOUNT_MAX, CART_AMOUNT_MIN, SERVER_ID_MAX_LENGTH } from '@common';
import { IsDefined, IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class GiveProductInput {
  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  server_id: string;

  @IsDefined()
  @IsInt()
  product_id: number;

  @IsDefined()
  @IsUUID()
  user_uuid: string;

  @IsDefined()
  @IsInt()
  @Min(CART_AMOUNT_MIN)
  @Max(CART_AMOUNT_MAX)
  amount: number;
}
