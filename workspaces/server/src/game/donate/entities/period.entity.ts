import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DonateGroup } from '../groups/entities/donate-group.entity';
import { DonatePermission } from '../permissions/entities/donate-permission.entity';

@Entity({
  name: "unicore_periods",
  orderBy: {
    multiplier: "ASC"
  }
})
export class Period {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "expire" })
  expire: number;

  @Column('float', {
    name: "multiplier",
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
