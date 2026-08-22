import { Allow, IsDefined, IsString, MaxLength } from 'class-validator';
import { IsUsername, TOKEN_MAX_LENGTH } from '@common';

export class VoteCallbackInput {
  @IsDefined()
  @IsUsername()
  username: string;

  @Allow()
  timestamp?: unknown;

  @IsDefined()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  token: string;
}
