import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Locale } from './locale.entity';

@Entity({ name: 'unicore_content_translations' })
@Index(['entity', 'entityId'])
export class ContentTranslation {
  @PrimaryColumn({ name: 'locale_code' })
  localeCode: string;

  @PrimaryColumn({ name: 'entity', length: 32 })
  entity: string;

  @PrimaryColumn({ name: 'entity_id', length: 64 })
  entityId: string;

  @PrimaryColumn({ name: 'path', length: 64 })
  path: string;

  @Column('longtext', { nullable: true, name: 'value' })
  value: string;

  @ManyToOne(() => Locale, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'locale_code' })
  locale: Locale;
}
