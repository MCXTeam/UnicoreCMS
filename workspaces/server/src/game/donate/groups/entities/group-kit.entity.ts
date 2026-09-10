import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonatePermission } from '../../permissions/entities/donate-permission.entity';
import { DonateGroup } from './donate-group.entity';
import { GroupKitServer } from './group-kit-server.entity';
import { Translatable } from 'src/admin/locales/translatable.decorator';

@Translatable('group_kit', ['name', 'description'])
@Entity({
  name: 'unicore_group_kits',
  orderBy: {
    priority: 'ASC',
  },
})
export class GroupKit {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'priority' })
  priority?: number;

  @Column('text', {
    nullable: true,
    name: 'description',
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

  @OneToMany(() => GroupKitServer, (item) => item.kit, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  servers: GroupKitServer[];
}
