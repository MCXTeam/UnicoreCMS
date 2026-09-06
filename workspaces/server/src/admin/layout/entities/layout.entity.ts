import { LayoutMode, LayoutPlace } from 'unicore-common';
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'unicore_layouts' })
export class Layout {
  @PrimaryColumn({ name: 'id', length: 16 })
  id: LayoutPlace;

  @Column({ name: 'mode', length: 16, default: 'builder' })
  mode: LayoutMode;

  @Column('longtext', { name: 'data', nullable: true })
  data: string;

  @Column('longtext', { name: 'html', nullable: true })
  html: string;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
