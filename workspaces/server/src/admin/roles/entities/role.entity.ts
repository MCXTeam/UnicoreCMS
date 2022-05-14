import { User } from 'src/admin/users/entities/user.entity';
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity({ name: "unicore_roles" })
export class Role {
  @PrimaryColumn({ name: "id" })
  id: string;

  @Column({ name: "name" })
  name: string;

  @Column('simple-array', {
    name: "perms",
    nullable: true,
  })
  perms: string[];

  @Column({ default: false, name: "important" })
  important: boolean;

  @Column({ default: 0, name: "priority" })
  priority: number;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
