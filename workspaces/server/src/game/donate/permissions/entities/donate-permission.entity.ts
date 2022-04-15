import { Server } from 'src/game/servers/entities/server.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Period } from '../../entities/period.entity';
import { GroupKit } from '../../groups/entities/group-kit.entity';
import { PermissionType } from '../enums/permission-type.enum';

@Entity({
  orderBy: {
    priority: "ASC",
    id: "ASC",
  }
})
export class DonatePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  priority?: number;

  @Column()
  type: PermissionType;

  @Column('float')
  price: number;

  @Column({ nullable: true })
  sale: number;

  @Column('longtext', {
    nullable: true,
  })
  description: string;

  @Column('simple-array', {
    nullable: true,
  })
  perms: string[];

  @Column('simple-array', {
    nullable: true,
  })
  web_perms: string[];

  @ManyToMany(() => GroupKit, (kit) => kit.permission, {
    eager: true,
  })
  @JoinTable()
  kits: GroupKit[];

  @ManyToMany(() => Server, (server) => server.donate_permissions)
  servers: Server[];

  @ManyToMany(() => Period, (period) => period.donate_permissions)
  @JoinTable()
  periods: Period[];
}
