import { SERVER_ID_MAX_LENGTH } from '@common';
import { IsAlphanumeric, IsDefined, MaxLength } from 'class-validator';
import { ServerUpdateInput } from './server-update.input';

export class ServerCreateInput extends ServerUpdateInput {
  @IsDefined()
  @IsAlphanumeric()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  id: string;
}
