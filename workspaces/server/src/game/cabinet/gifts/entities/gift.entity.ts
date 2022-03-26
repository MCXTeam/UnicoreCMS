import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GiftType } from '../enums/gift-type.enum';
import { GiftActivation } from './gift-activation.entity';

@Entity()
export class Gift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  promocode: string;

  @Column()
  type: GiftType;

  @OneToMany(() => GiftActivation, (activation) => activation.gift)
  activations: GiftActivation[];

  @Column({ nullable: true })
  max_activations: number;

  @Column({ nullable: true })
  expires: Date;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  product?: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  kit?: Kit;

  @ManyToOne(() => DonateGroup, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  donate_group?: DonateGroup;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  donate_permission?: DonatePermission;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  server?: Server;

  @ManyToOne(() => Period, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  period?: Period;

  @Column('float', {
    nullable: true,
  })
  amount?: number;

  @CreateDateColumn()
  created: Date;
}
