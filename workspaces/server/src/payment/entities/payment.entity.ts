import { decimalColumn, MONEY_PRECISION, MONEY_SCALE } from '@common';
import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatuses } from '../enums/payment-statuses.enum';

@Entity({ name: 'unicore_payments' })
@Index(['method', 'provider_id'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ nullable: true, name: 'bill_id' })
  bill_id: string;

  @Column({ nullable: true })
  provider_id: string;

  @Column('decimal', { nullable: true, precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  provider_amount: number;

  @Column({ nullable: true, length: 3 })
  provider_currency: string;

  @Column({ nullable: true, length: 3 })
  base_currency: string;

  @Column('decimal', { nullable: true, precision: 24, scale: 12, transformer: decimalColumn })
  exchange_rate: number;

  @Column({ nullable: true })
  exchange_date: string;

  @Column({ type: 'simple-json', nullable: true })
  provider_data: Record<string, string>;

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
