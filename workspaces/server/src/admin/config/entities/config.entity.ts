import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ConfigType } from '../config.enum';

@Entity({ name: "unicore_configs" })
export class Config {
  @PrimaryColumn({ name: "key" })
  key: string;

  @Column('text', {
    nullable: true,
    name: "value"
  })
  value: string;

  @Column({ name: "type" })
  type: ConfigType;

  @Column({ nullable: true, name: "important" })
  important: boolean;
}
