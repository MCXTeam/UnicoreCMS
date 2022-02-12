import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({
    unique: true,
  })
  uuid: string;

  @Column({
    nullable: true,
  })
  ip?: string;

  @Column({
    nullable: true,
  })
  agent?: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  expires: Date;

  @UpdateDateColumn()
  updated: Date;

  @CreateDateColumn()
  created: Date;
}
