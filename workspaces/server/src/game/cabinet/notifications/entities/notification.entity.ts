import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  NOTIFICATION_CATEGORY_MAX_LENGTH,
  NOTIFICATION_ICON_MAX_LENGTH,
  NOTIFICATION_KEY_MAX_LENGTH,
  NOTIFICATION_LINK_MAX_LENGTH,
  NOTIFICATION_TYPE_MAX_LENGTH,
  NotificationParams,
} from 'unicore-common';

@Entity({ name: 'unicore_notifications' })
@Index(['user_uuid', 'created'])
export class Notification {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_uuid' })
  user_uuid: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_uuid' })
  user?: User;

  @Column({ name: 'type', length: NOTIFICATION_TYPE_MAX_LENGTH })
  type: string;

  @Column({ name: 'category', length: NOTIFICATION_CATEGORY_MAX_LENGTH })
  category: string;

  @Column({ name: 'title_key', length: NOTIFICATION_KEY_MAX_LENGTH })
  title_key: string;

  @Column({ name: 'body_key', length: NOTIFICATION_KEY_MAX_LENGTH, nullable: true })
  body_key: string | null;

  @Column({ name: 'params', type: 'simple-json', nullable: true })
  params: NotificationParams | null;

  @Column({ name: 'link', length: NOTIFICATION_LINK_MAX_LENGTH, nullable: true })
  link: string | null;

  @Column({ name: 'icon', length: NOTIFICATION_ICON_MAX_LENGTH, nullable: true })
  icon: string | null;

  @Column({ name: 'read_at', nullable: true })
  read_at?: Date;

  @CreateDateColumn({ name: 'created' })
  created: Date;
}
