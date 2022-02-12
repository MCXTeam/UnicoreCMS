import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OnlinesRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  online: number;

  @CreateDateColumn()
  updated: Date;

  @CreateDateColumn()
  created: Date;
}
