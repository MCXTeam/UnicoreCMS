import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Attachment } from './attachments.entity';

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column('text')
  description: string;

  @OneToMany(() => Attachment, (attachment) => attachment.news)
  attachments: Attachment[];

  @CreateDateColumn()
  created: Date;
}
