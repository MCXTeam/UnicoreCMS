import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from '../../permissions/entities/donate-permission.entity';
import { DonateGroup } from './donate-group.entity';

@Entity()
export class GroupKit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', {
    nullable: true,
  })
  description?: string;

  @Column({ nullable: true })
  image: string;

  @ManyToMany(() => DonateGroup, (group) => group.kits, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  groups: DonateGroup[];

  @ManyToMany(() => DonatePermission, (perm) => perm.kits, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  permission: DonatePermission[];

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.image);
  }
}
