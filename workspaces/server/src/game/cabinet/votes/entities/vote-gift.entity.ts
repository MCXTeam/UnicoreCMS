import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_vote_gifts" })
export class VoteGift {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "place" })
  place: number;

  @Column('float', { name: "bonus" })
  bonus: number;
}
