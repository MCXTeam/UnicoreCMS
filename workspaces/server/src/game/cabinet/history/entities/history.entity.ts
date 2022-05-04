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

@Entity()
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: HistoryType;

  @Column({ nullable: true })
  ip: string;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Product, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  product?: Product;

  @ManyToOne(() => Kit, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  kit?: Kit;

  @ManyToOne(() => Server, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  server?: Server;

  @ManyToOne(() => DonateGroup, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  donate_group?: DonateGroup;

  @ManyToOne(() => DonatePermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  donate_permission?: DonatePermission;

  @ManyToOne(() => Period, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  period?: Period;

  @ManyToOne(() => Payment, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  payment?: Payment;
 
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  target?: User;

  @Column('float', {
    nullable: true,
  })
  amount?: number;

  @CreateDateColumn()
  created: Date;
}
