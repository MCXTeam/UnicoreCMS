import { User } from "src/admin/users/entities/user.entity";
import { CreateDateColumn, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Gift } from "./gift.entity";

@Entity()
export class GiftActivation {
  @ManyToOne(() => Gift, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true
  })
  @JoinColumn()
  gift?: Gift;

  @ManyToOne(() => User, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true
  })
  @JoinColumn()
  user?: User;

  @CreateDateColumn()
  created: Date;
}