import { User } from 'src/admin/users/entities/user.entity';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HistoryType } from '../enums/history-type.enum';

@Entity({ name: "unicore_histories" })
export class History {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "type" })
  type: HistoryType;

  @Column({ nullable: true, name: "ip" })
  ip: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: "user_uuid" })
  user: User;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "kit_id" })
  kit?: Kit;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "server_id" })
  server?: Server;

  @ManyToOne(() => DonateGroup, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "donate_group_id" })
  donate_group?: DonateGroup;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "donate_permission_id" })
  donate_permission?: DonatePermission;

  @ManyToOne(() => Period, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "period_id" })
  period?: Period;

  @ManyToOne(() => Payment, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "payment_id" })
  payment?: Payment;
 
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: "target_uuid" })
  target?: User;

  @Column('float', {
    name: "amount",
    nullable: true,
  })
  amount?: number;

  @CreateDateColumn({ name: "created" })
  created: Date;
}
