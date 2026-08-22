import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_api_tokens' })
export class ApiToken {
  @PrimaryColumn({ name: 'secret' })
  secret: string;

  @Column({ name: 'hint', nullable: true })
  hint?: string;

  @Column({ name: 'comment', nullable: true })
  comment?: string;

  // Allowed Ip List
  @Column('simple-array', {
    nullable: true,
    name: 'allow',
  })
  allow?: string[];

  @Column('simple-array', {
    nullable: true,
    name: 'perms',
  })
  perms?: string[];

  @Column('simple-array', {
    nullable: true,
    name: 'servers',
  })
  servers?: string[];

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
