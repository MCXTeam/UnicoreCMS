import { NAME_MAX_LENGTH } from '@common';
import { IsDefined, IsString, MaxLength } from 'class-validator';

export class GiftActivateInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  gift_code: string;
}
