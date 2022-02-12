import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { AfterRemove, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Skin {
  @Column()
  file: string;

  @Column({
    nullable: true,
  })
  slim: boolean;

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
