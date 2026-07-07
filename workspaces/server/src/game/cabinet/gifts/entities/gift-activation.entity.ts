import { User } from 'src/admin/users/entities/user.entity';
import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Gift } from './gift.entity';

@Entity({ name: 'unicore_gift_activations' })
export class GiftActivation {
  @PrimaryColumn({ name: 'gift_id' })
  giftId: number;

  @ManyToOne(() => Gift, {
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'gift_id' })
  gift?: Gift;

  @PrimaryColumn({ name: 'user_uuid' })
  userUuid: string;

  @ManyToOne(() => User, {
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user?: User;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
