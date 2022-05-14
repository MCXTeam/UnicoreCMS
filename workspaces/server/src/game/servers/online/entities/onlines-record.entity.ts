import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_onlines_records" })
export class OnlinesRecord {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ default: 0, name: "online" })
  online: number;

  @CreateDateColumn({ name: "updated" })
  updated: Date;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
