import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Role } from 'src/admin/roles/entities/role.entity';

@Entity({ name: 'unicore_web_role_origins' })
export class WebRoleOrigin {
  @PrimaryColumn({ name: 'user_uuid' })
  userUuid: string;

  @PrimaryColumn({ name: 'role_id' })
  roleId: string;

  @Column({ default: false })
  manual: boolean;

  @Column({ default: false })
  legacy: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_uuid' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
