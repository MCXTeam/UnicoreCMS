import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GiftType } from '../enums/gift-type.enum';
import { GiftActivation } from './gift-activation.entity';

@Entity({ name: "unicore_gifts" })
export class Gift {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "promocode", unique: true })
  promocode: string;

  @Column({ name: "type" })
  type: GiftType;

  @OneToMany(() => GiftActivation, (activation) => activation.gift)
  activations: GiftActivation[];

  @Column({ nullable: true, name: "max_activations" })
  max_activations: number;

  @Column({ nullable: true, name: "expires" })
  expires: Date;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "kit_id" })
  kit?: Kit;

  @ManyToOne(() => DonateGroup, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "donate_group_id" })
  donate_group?: DonateGroup;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "donate_permission_id" })
  donate_permission?: DonatePermission;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "server_id" })
  server?: Server;

  @ManyToOne(() => Period, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: "period_id" })
  period?: Period;

  @Column('float', {
    name: "amount",
    nullable: true,
  })
  amount?: number;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
