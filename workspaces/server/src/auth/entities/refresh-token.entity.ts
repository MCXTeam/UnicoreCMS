import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: "unicore_refresh_tokens" })
export class RefreshToken {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Generated('uuid')
  @Column({
    name: "uuid",
    unique: true,
  })
  uuid: string;

  @Column({
    name: "ip",
    nullable: true,
  })
  ip?: string;

  @Column({
    name: "agent",
    nullable: true,
  })
  agent?: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @Column({ name: "expires" })
  expires: Date;

  @UpdateDateColumn({ name: "updated" })
  updated: Date;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
