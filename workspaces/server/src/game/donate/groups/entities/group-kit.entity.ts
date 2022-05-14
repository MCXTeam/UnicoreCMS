import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from '../../permissions/entities/donate-permission.entity';
import { DonateGroup } from './donate-group.entity';
import { GroupKitImage } from './group-kit-image.entity';

@Entity({
  name: "unicore_group_kits",
  orderBy: {
    priority: "ASC"
  }
})
export class GroupKit {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ nullable: true, name: "priority" })
  priority?: number;

  @Column('text', {
    nullable: true,
    name: "description"
  })
  description?: string;

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

  @OneToMany(() => GroupKitImage, (item) => item.kit, {
    cascade: ['insert', 'update'],
    eager: true
  })
  images: GroupKitImage[]
}
