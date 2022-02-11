import { IsAlpha, IsDefined } from "class-validator";
import { RoleUpdateInput } from "./role-update.input";

export class RoleCreateInput extends RoleUpdateInput {
  @IsDefined()
  @IsAlpha()
  id: string;
}
