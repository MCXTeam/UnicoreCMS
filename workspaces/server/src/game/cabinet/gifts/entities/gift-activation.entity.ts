import { User } from 'src/admin/users/entities/user.entity';
import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Gift } from './gift.entity';

@Entity({ name: "unicore_gift_activations" })
export class GiftActivation {
  @ManyToOne(() => Gift, {
    cascade: ["insert", "update", "remove"],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true
  })
  @JoinColumn({ name: "gift_id" })
  gift?: Gift;

  @ManyToOne(() => User, {
    cascade: ["insert", "update", "remove"],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true
  })
  @JoinColumn({ name: "user_uuid" })
  user?: User;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
