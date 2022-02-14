import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { EmailMessageType } from "../enums/email-message-type.enum";

@Entity()
export class EmailMessage {
  @PrimaryColumn()
  id: EmailMessageType

  @Column()
  title: string

  @Column('longtext', { nullable: true })
  content: string

  @UpdateDateColumn()
  updated: Date
}