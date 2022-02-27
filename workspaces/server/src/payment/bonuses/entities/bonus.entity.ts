import { StorageManager } from "@common";
import { AfterRemove, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Bonus {
  @PrimaryGeneratedColumn()
  id: number

  @Column('float')
  bonus: number;

  @Column('float')
  amount: number;

  @Column({ nullable: true })
  icon: string

  @AfterRemove()
  removeFile() {
    StorageManager.remove(this.icon);
  }
}