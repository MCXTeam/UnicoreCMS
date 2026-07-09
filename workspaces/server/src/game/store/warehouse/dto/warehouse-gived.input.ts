import { IsInt, Min } from 'class-validator';

export class WarehouseGivedInput {
  @IsInt()
  id: number;

  @IsInt()
  @Min(1)
  amount: number;
}
