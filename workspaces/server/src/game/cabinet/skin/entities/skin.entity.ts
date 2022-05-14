import { StorageManager } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { AfterRemove, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

@Entity({ name: "unicore_skins" })
export class Skin {
  @Column({ name: "file" })
  file: string;

  @Column({
    name: "slim",
    nullable: true,
  })
  slim: boolean;

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
