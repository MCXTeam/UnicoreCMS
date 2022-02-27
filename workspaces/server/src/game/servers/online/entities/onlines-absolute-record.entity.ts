import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OnlinesAbsoluteRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  online: number;

  @CreateDateColumn()
  created: Date;
}
