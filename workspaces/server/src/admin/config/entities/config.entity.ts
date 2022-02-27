import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Config {
  @PrimaryColumn()
  key: string;

  @Column('text', {
    nullable: true,
  })
  value: string;
}
