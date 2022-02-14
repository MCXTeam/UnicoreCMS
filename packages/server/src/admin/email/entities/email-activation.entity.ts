import { User } from "src/admin/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EmailMessageType } from "../enums/email-message-type.enum";

@Entity()
export class EmailActivation {
  @PrimaryGeneratedColumn()
  id: EmailMessageType

  @Column()
  code: string

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  created: Date
}