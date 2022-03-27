import { IsDefined, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { MoneyTransferType } from "./money.input";

export class MoneyUpdateInput {
  @IsDefined()
  @IsEnum(MoneyTransferType)
  type: MoneyTransferType;

  @IsDefined()
  @IsString()
  uuid: string;

  @IsOptional()
  @IsString()
  server: string;

  @IsDefined()
  @IsNumber()
  amount: number;
}