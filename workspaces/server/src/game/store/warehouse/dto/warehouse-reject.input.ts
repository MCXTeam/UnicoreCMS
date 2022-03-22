import { IsArray, IsDefined, IsInt, IsString } from 'class-validator';

export class WarehouseRejectInput {
  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  rejected_items: number[];

  @IsDefined()
  @IsString()
  user_uuid: string;
}
