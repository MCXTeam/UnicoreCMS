import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { ROLE_COLOR_MAX_LENGTH, RoleBadgeEffect } from 'unicore-common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity({ name: 'unicore_roles' })
export class Role {
  @PrimaryColumn({ name: 'id' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column('simple-array', {
    name: 'perms',
    nullable: true,
  })
  perms: string[];

  @Column({ default: false, name: 'important' })
  important: boolean;

  @Column({ default: 0, name: 'priority' })
  priority: number;

  @Column({ name: 'color', length: ROLE_COLOR_MAX_LENGTH, nullable: true })
  color: string;

  @Column({ default: false, name: 'badge' })
  badge: boolean;

  @Column({ name: 'badge_color', length: ROLE_COLOR_MAX_LENGTH, nullable: true })
  badge_color: string;

  @Column({ name: 'badge_background', length: ROLE_COLOR_MAX_LENGTH, nullable: true })
  badge_background: string;

  @Column({ name: 'badge_background_end', length: ROLE_COLOR_MAX_LENGTH, nullable: true })
  badge_background_end: string;

  @Column({ name: 'badge_image', nullable: true })
  badge_image: string;

  @Column({ name: 'badge_effect', type: 'int', default: RoleBadgeEffect.None })
  badge_effect: RoleBadgeEffect;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.badge_image);
  }
}
