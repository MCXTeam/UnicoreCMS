import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { AfterRemove, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity({ name: "unicore_cloaks" })
export class Cloak {
  @Column({ name: "file" })
  file: string;

  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "user_uuid" })
  user?: User;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.file);
  }
}
