import { User } from 'src/admin/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatuses } from '../enums/payment-statuses.enum';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  bill_id: string

  @Column()
  method: string;

  @Column('float')
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

  @Column({ nullable: true })
  ip: string

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;
}
