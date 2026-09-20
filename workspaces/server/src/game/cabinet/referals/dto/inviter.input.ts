import { NAME_MAX_LENGTH } from '@common';
import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InviterInput {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  code: string;
}
