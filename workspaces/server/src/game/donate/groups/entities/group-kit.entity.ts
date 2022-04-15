import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from '../../permissions/entities/donate-permission.entity';
import { DonateGroup } from './donate-group.entity';
import { GroupKitImage } from './group-kit-image.entity';

@Entity({
  orderBy: {
    priority: "ASC"
  }
})
export class GroupKit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  priority?: number;

  @Column('text', {
    nullable: true,
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
  @JoinTable()
  images: GroupKitImage[]
}
