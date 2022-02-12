import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { News } from './news.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('blob', { nullable: true })
  file: Buffer;

  @Column({ nullable: true })
  url: string;

  @ManyToOne(() => News, (news) => news.attachments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  readonly news: News;
}
