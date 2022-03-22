import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ApiToken {
  @PrimaryColumn()
  secret: string;

  // Allowed Ip List
  @Column('simple-array', {
    nullable: true,
  })
  allow?: string[];

  @Column('simple-array', {
    nullable: true,
  })
  perms?: string[];

  @UpdateDateColumn()
  updated: Date;

  @CreateDateColumn()
  created: Date;
}
