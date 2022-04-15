import { Type } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsDefined, IsInt } from 'class-validator';

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
  @Type(() => ServerSortInput)
  items: ServerSortInput[]
}