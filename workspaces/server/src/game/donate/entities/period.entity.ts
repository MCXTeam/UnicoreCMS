import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonateGroup } from '../groups/entities/donate-group.entity';
import { DonatePermission } from '../permissions/entities/donate-permission.entity';

@Entity({
  orderBy: {
    multiplier: "ASC"
  }
})
export class Period {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  expire: number;

  @Column('float', {
    default: 1,
  })
  multiplier: number;

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
