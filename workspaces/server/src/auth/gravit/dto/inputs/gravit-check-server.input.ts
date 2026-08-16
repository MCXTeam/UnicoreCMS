import { IsDefined, IsString, MaxLength } from 'class-validator';
import { IsUsername, SERVER_ID_MAX_LENGTH } from '@common';

export class GravitCheckServer {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  serverId: string;
}
