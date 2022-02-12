import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ApiToken {
  @PrimaryGeneratedColumn()
  id: number;

  // Allowed Ip List
  @Column('simple-array')
  allow?: string[];

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @UpdateDateColumn()
  updated: Date;

  @CreateDateColumn()
  created: Date;
}
