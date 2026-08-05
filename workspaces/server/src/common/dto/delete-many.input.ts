import { IsArray, IsDefined, IsInt, IsUUID } from 'class-validator';

export class DeleteManyInput {
  @IsDefined()
  @IsArray()
  @IsInt({ each: true })
  items: number[];
}

export class DeleteManyUuidInput {
  @IsDefined()
  @IsArray()
  @IsUUID(undefined, { each: true })
  items: string[];
}
