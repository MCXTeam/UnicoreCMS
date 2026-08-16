import { decimalColumn, MONEY_PRECISION, MONEY_SCALE } from '@common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'unicore_vote_gifts' })
export class VoteGift {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'place' })
  place: number;

  @Column('decimal', { name: 'bonus', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  bonus: number;
}
