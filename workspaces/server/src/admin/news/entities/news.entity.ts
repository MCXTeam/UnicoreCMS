import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('news', ['title', 'short_description', 'description'])
@Entity({ name: 'unicore_news' })
export class News {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ nullable: true, name: 'title' })
  title: string;

  @Column('text', { name: 'description' })
  description: string;

  @Column('text', { nullable: true, name: 'short_description' })
  short_description: string;

  @Column('longtext', { nullable: true, name: 'custom_css' })
  custom_css: string;

  @Column('longtext', { nullable: true, name: 'custom_js' })
  custom_js: string;

  @Column({ default: false, name: 'full_size' })
  full_size: boolean;

  @Column({ nullable: true, name: 'image' })
  image: string;

  @Column({ nullable: true, name: 'link' })
  link: string;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
