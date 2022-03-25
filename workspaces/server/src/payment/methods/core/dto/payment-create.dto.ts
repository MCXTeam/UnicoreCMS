import { IsDefined, IsNumber, Min } from "class-validator"

export class PaymentCreateDto {
  @IsDefined()
  @IsNumber()
  @Min(1)
  amount: number
}