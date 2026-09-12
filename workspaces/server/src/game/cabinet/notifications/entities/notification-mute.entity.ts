import { User } from 'src/admin/users/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { NOTIFICATION_CATEGORY_MAX_LENGTH } from 'unicore-common';

@Entity({ name: 'unicore_notification_mutes' })
export class NotificationMute {
  @PrimaryColumn({ name: 'user_uuid' })
  user_uuid: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user?: User;

  @PrimaryColumn({ name: 'category', length: NOTIFICATION_CATEGORY_MAX_LENGTH })
  category: string;
}
