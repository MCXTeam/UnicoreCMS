import { Role } from 'src/admin/roles/entities/role.entity';
import { Cloak } from 'src/game/cabinet/skin/entities/cloak.entity';
import { Skin } from 'src/game/cabinet/skin/entities/skin.entity';
import { Column, CreateDateColumn, Entity, Generated, JoinTable, ManyToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  @Generated('uuid')
  uuid: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  superuser: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles?: Role[];

  @Column('simple-array', { default: '' })
  perms: string[];

  // @OneToMany(() => Payment, payment => payment.user)
  // payments: Payment[]

  @OneToOne(() => Skin, (skin) => skin.user)
  skin?: Skin;

  @OneToOne(() => Cloak, (cloak) => cloak.user)
  cloak?: Cloak;

  @ManyToMany(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  referals?: User[];

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
