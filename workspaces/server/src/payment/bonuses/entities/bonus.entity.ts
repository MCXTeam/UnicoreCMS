import { MONEY_PRECISION, MONEY_SCALE, StorageManager, decimalColumn } from '@common';
import { AfterRemove, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'unicore_bonuses' })
export class Bonus {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('decimal', { name: 'bonus', precision: MONEY_PRECISION, scale: MONEY_SCALE, transformer: decimalColumn })
  bonus: number;

  @Column('float')
  amount: number;

  @Column({ nullable: true, name: 'icon' })
  icon: string;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
