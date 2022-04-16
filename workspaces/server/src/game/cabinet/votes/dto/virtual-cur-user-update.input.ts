import { IsDefined, IsNumber, IsString } from "class-validator";

export class VirtualCurrencyUserUpdate {
  @IsDefined()
  @IsString()
  uuid: string;

  @IsDefined()
  @IsNumber()
  amount: number;
}