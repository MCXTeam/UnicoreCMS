import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ApiToken {
  @PrimaryColumn()
  secret: string;

  // Allowed Ip List
  @Column('simple-array', {
    default: '',
  })
  allow?: string[];

  @Column('simple-array', {
    default: '',
  })
  perms?: string[];

  @UpdateDateColumn()
  updated: Date;

  @CreateDateColumn()
  created: Date;
}
