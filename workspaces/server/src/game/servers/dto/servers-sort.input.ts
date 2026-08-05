import { Type } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsDefined, IsInt, ValidateNested } from 'class-validator';

class ServerSortInput {
  @IsDefined()
  @IsAlphanumeric()
  id: string;

  @IsDefined()
  @IsInt()
  priority: number;
}

export class ServersSortInput {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerSortInput)
  items: ServerSortInput[];
}
