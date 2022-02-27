import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod } from '../enums/payment-methods.enum';
import { PaymentStatuses } from '../enums/payment-statuses.enum';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  method: PaymentMethod;

  @Column('decimal', {
    precision: 5,
    scale: 2,
  })
  amount: number;

  @Column({
    default: PaymentStatuses.WAITING,
  })
  status: PaymentStatuses;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
