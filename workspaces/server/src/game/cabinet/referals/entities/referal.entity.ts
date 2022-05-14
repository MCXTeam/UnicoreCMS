import { User } from "src/admin/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";

@Entity({ name: "unicore_referals" })
export class Referal {
  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
    nullable: false,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: "inviter_uuid" })
  inviter: User;

  @Column({ name: "rewarded", nullable: true })
  rewarded: boolean;
}