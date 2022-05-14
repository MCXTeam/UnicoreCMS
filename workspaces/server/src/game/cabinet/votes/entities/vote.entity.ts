import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_votes" })
export class Vote {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "monitoring" })
  monitoring: string;

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
