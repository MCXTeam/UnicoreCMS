import { RCON_COMMAND_MAX_LENGTH } from '@common';
import { IsDefined, IsString, MaxLength } from 'class-validator';

export class RconRunInput {
  @IsDefined()
  @IsString()
  @MaxLength(RCON_COMMAND_MAX_LENGTH)
  command: string;
}
