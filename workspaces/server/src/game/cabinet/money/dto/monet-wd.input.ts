import { IsDefined, IsNumber, IsString, Min } from 'class-validator';

export class MoneyWDInput {
  @IsDefined()
  @IsString()
  server_id: string;

  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number;
}
