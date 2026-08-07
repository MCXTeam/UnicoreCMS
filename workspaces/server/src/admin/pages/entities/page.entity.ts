import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('page', ['title', 'description', 'content'])
@Entity({ name: 'unicore_pages' })
export class Page {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ nullable: true, unique: true, name: 'is_rules' })
  is_rules: boolean;

  @Column({ name: 'title' })
  title: string;

  @Column({ unique: true, name: 'path' })
  path: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column('longtext', { nullable: true, name: 'content' })
  content: string;

  @Column({ default: false, name: 'full_size' })
  full_size: boolean;

  @Column('longtext', { nullable: true, name: 'custom_css' })
  custom_css: string;

  @Column('longtext', { nullable: true, name: 'custom_js' })
  custom_js: string;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
