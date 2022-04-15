import { IsAlphanumeric, IsDefined } from 'class-validator';
import { ServerUpdateInput } from './server-update.input';

export class ServerCreateInput extends ServerUpdateInput {
  @IsDefined()
  @IsAlphanumeric()
  id: string;
}
