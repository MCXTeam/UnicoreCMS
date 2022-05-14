import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity({ name: "unicore_bans" })
export class Ban {
  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "actor_uuid" })
  actor: User;

  @Column({ name: "reason" })
  reason: string;

  @Column({ nullable: true, name: "expires" })
  expires?: Date;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
