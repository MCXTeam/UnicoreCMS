import { IsDefined, IsString } from 'class-validator';

export class GiftActivateInput {
  @IsDefined()
  @IsString()
  gift_code: string;
}
