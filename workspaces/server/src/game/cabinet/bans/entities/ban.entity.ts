import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';

@Entity({ name: 'unicore_bans' })
export class Ban {
  @PrimaryColumn({ name: 'user_uuid' })
  userUuid: string;

  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user: User;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'actor_uuid' })
  actor: User;

  @Column({ name: 'reason' })
  reason: string;

  @Column({ nullable: true, name: 'expires' })
  expires?: Date;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
