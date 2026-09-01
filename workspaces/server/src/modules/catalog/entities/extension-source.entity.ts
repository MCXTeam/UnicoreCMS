import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EXTENSION_SOURCE_LOCATION_MAX_LENGTH, EXTENSION_SOURCE_NAME_MAX_LENGTH, ExtensionKind, ExtensionSourceType } from 'unicore-common';

@Entity({ name: 'unicore_extension_sources' })
export class ExtensionSource {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name', length: EXTENSION_SOURCE_NAME_MAX_LENGTH })
  name: string;

  @Column({ name: 'kind', length: 16 })
  kind: ExtensionKind;

  @Column({ name: 'type', length: 16 })
  type: ExtensionSourceType;

  @Column({ name: 'location', length: EXTENSION_SOURCE_LOCATION_MAX_LENGTH })
  location: string;

  @Column('text', { name: 'token', nullable: true })
  token?: string;

  @Column({ name: 'builtin', default: false })
  builtin: boolean;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
