import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EmailMessageType } from '../enums/email-message-type.enum';

@Entity({ name: "unicore_email_messages" })
export class EmailMessage {
  @PrimaryColumn({ name: "id" })
  id: EmailMessageType;

  @Column({ name: "title" })
  title: string;

  @Column('longtext', { nullable: true, name: "content" })
  content: string;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;
}
