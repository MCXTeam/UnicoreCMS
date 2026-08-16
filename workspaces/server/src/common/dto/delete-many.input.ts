import { ArrayMaxSize, IsArray, IsDefined, IsInt, IsUUID } from 'class-validator';
import { BULK_ITEMS_MAX } from '../constants';

export class DeleteManyInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  items: number[];
}

export class DeleteManyUuidInput {
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsUUID(undefined, { each: true })
  items: string[];
}
