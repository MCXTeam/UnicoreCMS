import { PRICE_MAX, PRICE_MIN, VOTE_PLACE_MAX } from '@common';
import { IsDefined, IsInt, IsNumber, Max, Min } from 'class-validator';

export class VoteGiftInput {
  @IsDefined()
  @IsNumber()
  @Min(PRICE_MIN)
  @Max(PRICE_MAX)
  bonus: number;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(VOTE_PLACE_MAX)
  place: number;
}
