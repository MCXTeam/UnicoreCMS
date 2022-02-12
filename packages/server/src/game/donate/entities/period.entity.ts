import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { DonateGroup } from '../groups/entities/donate-group.entity';
import { DonatePermission } from '../permissions/entities/donate-permission.entity';

@Entity()
export class Period {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  expire: number;

  @Column({ nullable: true })
  not_expire: boolean;

  @ManyToMany(() => DonateGroup, (group) => group.periods, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  donate_groups: DonateGroup[];

  @ManyToMany(() => DonatePermission, (permission) => permission.periods, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  donate_permissions: DonatePermission[];
}
