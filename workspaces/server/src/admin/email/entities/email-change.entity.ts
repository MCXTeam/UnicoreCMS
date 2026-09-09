import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'unicore_email_changes' })
export class EmailChange {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'code' })
  code: string;

  @Column({ name: 'attempts', default: 0 })
  attempts: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user: User;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
