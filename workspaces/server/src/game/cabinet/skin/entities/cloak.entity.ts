import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { AfterRemove, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity()
export class Cloak {
  @Column()
  file: string;

  @OneToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  user?: User;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.file);
  }
}
