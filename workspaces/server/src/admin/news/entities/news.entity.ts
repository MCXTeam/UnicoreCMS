import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_news" })
export class News {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ nullable: true, name: "title" })
  title: string;

  @Column('text', { name: "description" })
  description: string;

  @Column({ nullable: true, name: "image" })
  image: string;

  @Column({ nullable: true, name: "link" })
  link: string;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
