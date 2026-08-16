import { decimalColumn, MONEY_PRECISION, MONEY_SCALE } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatuses } from '../enums/payment-statuses.enum';

@Entity({ name: 'unicore_payments' })
export class Payment {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ nullable: true, name: 'bill_id' })
  bill_id: string;

  @Column({ name: 'method' })
  method: string;

  @Column('decimal', { name: 'amount', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  amount: number;

  @Column({
    name: 'status',
    default: PaymentStatuses.WAITING,
  })
  status: PaymentStatuses;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_uuid' })
  user: User;

  @Column({ name: 'ip', nullable: true })
  ip: string;

  @CreateDateColumn({ name: 'created' })
  created: Date;

  @UpdateDateColumn({ name: 'updated' })
  updated: Date;
}
