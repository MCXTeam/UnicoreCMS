import { Type } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsDefined, IsInt, ValidateNested } from 'class-validator';

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
  @ValidateNested({ each: true })
  @Type(() => CommonSortInputEntity)
  items: CommonSortInputEntity[];
}
