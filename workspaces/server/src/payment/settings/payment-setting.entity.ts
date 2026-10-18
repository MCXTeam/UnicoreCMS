import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'unicore_payment_settings' })
export class PaymentSetting {
  @PrimaryColumn({ length: 64 })
  id: string;

  @Column({ type: 'text' })
  value: string;
}
