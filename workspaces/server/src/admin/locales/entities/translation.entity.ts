import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Locale } from './locale.entity';

@Entity({ name: 'unicore_translations' })
export class Translation {
  @PrimaryColumn({ name: 'locale_code' })
  localeCode: string;

  @PrimaryColumn({ name: 'translation_key' })
  key: string;

  @Column('text', { nullable: true, name: 'value' })
  value: string;

  @ManyToOne(() => Locale, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'locale_code' })
  locale: Locale;
}
