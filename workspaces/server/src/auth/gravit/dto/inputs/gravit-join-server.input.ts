import { IsDefined, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsUsername, SERVER_ID_MAX_LENGTH, TOKEN_MAX_LENGTH } from '@common';

export class GravitJoinServer {
  @IsDefined()
  @IsUsername()
  username: string;

  @IsDefined()
  @IsUUID()
  uuid: string;

  @IsDefined()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  accessToken: string;

  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  serverId: string;
}
