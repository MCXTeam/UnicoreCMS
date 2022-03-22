import { IsDefined, IsEnum, IsNumber, IsString, Min } from "class-validator"

export enum MoneyTransferType {
  Real,
  Money,
}

export class MoneyInput {
  @IsDefined()
  @IsEnum(MoneyTransferType)
  type: MoneyTransferType

  @IsDefined()
  @IsString()
  username: string

  @IsDefined()
  @IsString()
  server: string

  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number
}