import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { AfterRemove, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity({ name: 'unicore_cloaks' })
export class Cloak {
  @Column({ name: 'file' })
  file: string;

  @PrimaryColumn({ name: 'user_uuid' })
  userUuid: string;

  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user?: User;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.file);
  }
}
