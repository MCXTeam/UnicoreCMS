import { IsDefined, IsString, MaxLength } from 'class-validator';
import { IsUsername, TOKEN_MAX_LENGTH } from '@common';

export class McrateCallbackInput {
  @IsDefined()
  @IsUsername()
  nick: string;

  @IsDefined()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  hash: string;
}
