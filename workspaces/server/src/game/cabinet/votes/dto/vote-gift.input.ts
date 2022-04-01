import { IsDefined, IsInt, IsNumber } from 'class-validator';

export class VoteGiftInput {
  @IsDefined()
  @IsNumber()
  bonus: number;

  @IsDefined()
  @IsInt()
  place: number;
}
