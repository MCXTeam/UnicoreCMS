import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_onlines_absolute_records" })
export class OnlinesAbsoluteRecord {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ default: 0, name: "online" })
  online: number;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
