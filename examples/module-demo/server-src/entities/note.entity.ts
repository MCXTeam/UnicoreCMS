import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'mod_demo_notes' })
export class DemoNote {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @Column({ name: 'uuid', nullable: true })
  uuid: string

  @Column('text', { name: 'text' })
  text: string

  @CreateDateColumn({ name: 'created' })
  created: Date
}
