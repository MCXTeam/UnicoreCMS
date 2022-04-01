import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class VoteGift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  place: number;

  @Column('float')
  bonus: number;
}
