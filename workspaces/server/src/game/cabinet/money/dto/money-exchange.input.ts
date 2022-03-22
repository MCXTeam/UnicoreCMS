import { IsDefined, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum MoneyExchangeType {
  Buy,
  Transfer,
}

export class MoneyExchangeInput {
  @IsDefined()
  @IsEnum(MoneyExchangeType)
  type: MoneyExchangeType;

  @IsOptional()
  @IsString()
  from_server: string;

  @IsDefined()
  @IsString()
  server: string;

  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number;
}
