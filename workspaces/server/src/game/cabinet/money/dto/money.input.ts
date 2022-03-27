import { IsDefined, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum MoneyTransferType {
  Real,
  Money,
}

export class MoneyInput {
  @IsDefined()
  @IsEnum(MoneyTransferType)
  type: MoneyTransferType;

  @IsDefined()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  server: string;

  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number;
}
