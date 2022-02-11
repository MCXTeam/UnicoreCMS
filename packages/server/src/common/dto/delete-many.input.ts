import { IsArray, IsDefined } from "class-validator";

export class DeleteManyInput {
  @IsDefined()
  @IsArray()
  items: any[]
}