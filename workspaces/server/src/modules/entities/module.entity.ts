import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_modules' })
export class ModuleRecord {
  @PrimaryColumn({ name: 'id' })
  id: string;

  @Column({ name: 'version' })
  version: string;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @Column('text', { name: 'broken_reason', nullable: true })
  brokenReason?: string;

  @CreateDateColumn({ name: 'installed' })
  installed: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
