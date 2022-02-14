import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Page {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true, unique: true })
  is_rules: boolean

  @Column()
  title: string

  @Column({ unique: true })
  path: string

  @Column({ nullable: true })
  description: string

  @Column('longtext', { nullable: true })
  content: string

  @CreateDateColumn()
  created: Date

  @UpdateDateColumn()
  updated: Date
}