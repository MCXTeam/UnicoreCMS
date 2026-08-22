import { IsDefined, IsString, MaxLength } from 'class-validator';
import { IsUsername, TOKEN_MAX_LENGTH } from '@common';

export class MctopCallbackInput {
  @IsDefined()
  @IsUsername()
  nickname: string;

  @IsDefined()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  token: string;
}
