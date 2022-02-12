import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { OauthProvider } from '../strategies/oauth-providers';

@Entity()
export class Oauth {
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  user: User;

  @PrimaryColumn()
  oauth_provider: OauthProvider;

  @Column()
  oauth_id: number;

  @CreateDateColumn()
  created: Date;
}
