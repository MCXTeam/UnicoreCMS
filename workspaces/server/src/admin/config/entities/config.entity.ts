import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ConfigType } from '../config.enum';

@Entity()
export class Config {
  @PrimaryColumn()
  key: string;

  @Column('text', {
    nullable: true,
  })
  value: string;

  @Column()
  type: ConfigType;

  @Column({ nullable: true })
  important: boolean
}
