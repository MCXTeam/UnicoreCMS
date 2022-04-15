import { Type } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsDefined, IsInt } from 'class-validator';

class CommonSortInputEntity {
  @IsDefined()
  @IsAlphanumeric()
  id: number;

  @IsDefined()
  @IsInt()
  priority: number;
}

export class CommonSortInput {
  @IsArray()
  @Type(() => CommonSortInputEntity)
  items: CommonSortInputEntity[]
}