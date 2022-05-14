import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_password_resets" })
export class PasswordReset {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "hash" })
  hash: string;

  @Column({ name: "ip" })
  ip: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
