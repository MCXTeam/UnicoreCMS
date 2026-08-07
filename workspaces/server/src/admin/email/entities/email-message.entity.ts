import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EmailMessageType } from '../enums/email-message-type.enum';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('email_message', ['title', 'content'])
@Entity({ name: 'unicore_email_messages' })
export class EmailMessage {
  @PrimaryColumn({ name: 'id' })
  id: EmailMessageType;

  @Column({ name: 'title' })
  title: string;

  @Column('longtext', { nullable: true, name: 'content' })
  content: string;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
