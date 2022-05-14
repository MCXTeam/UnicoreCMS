import { StorageManager } from '@common';
import { AfterRemove, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "unicore_bonuses" })
export class Bonus {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column('float', { name: "bonus" })
  bonus: number;

  @Column('float')
  amount: number;

  @Column({ nullable: true, name: "icon" })
  icon: string;

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}
