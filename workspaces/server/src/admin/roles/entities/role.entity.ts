import { User } from 'src/admin/users/entities/user.entity';
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column('simple-array', {
    nullable: true
  })
  perms: string[];

  @Column({ default: false })
  important: boolean;

  @Column({ default: 0 })
  priority: number;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
