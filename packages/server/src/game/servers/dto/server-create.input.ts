import { IsAlpha, IsDefined } from "class-validator";
import { ServerUpdateInput } from "./server-update.input";

export class ServerCreateInput extends ServerUpdateInput {
  @IsDefined()
  @IsAlpha()
  id: string;
}