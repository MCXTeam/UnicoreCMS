import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { OauthProvider } from '../strategies/oauth-providers';

@Entity({ name: "unicore_oauths" })
export class Oauth {
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @PrimaryColumn({ name: "oauth_provider" })
  oauth_provider: OauthProvider;

  @Column({ name: "oauth_id" })
  oauth_id: number;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
