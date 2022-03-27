import { IsDefined, IsInt, IsString } from 'class-validator';

export class GiveProductInput {
  @IsDefined()
  @IsString()
  server_id: string;

  @IsDefined()
  @IsString()
  product_id: string;

  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsDefined()
  @IsInt()
  amount: number;
}
