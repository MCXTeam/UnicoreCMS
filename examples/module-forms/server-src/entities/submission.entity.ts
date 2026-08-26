import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Form } from './form.entity'

export interface SubmissionAnswer {
  key: string
  type: string
  label: string
  value: unknown
}

@Entity({ name: 'mod_forms_submissions' })
export class FormSubmission {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @ManyToOne(() => Form, { onDelete: 'CASCADE', onUpdate: 'CASCADE', eager: true })
  @JoinColumn({ name: 'form_id' })
  form: Form

  @Column({ name: 'user_uuid', length: 36, nullable: true })
  user_uuid: string

  @Column({ name: 'username', length: 32, nullable: true })
  username: string

  @Column({ name: 'email', length: 120, nullable: true })
  email: string

  @Column({ name: 'ip', length: 45, nullable: true })
  ip: string

  @Column('simple-json', { name: 'answers' })
  answers: SubmissionAnswer[]

  @Column({ name: 'status', length: 16, default: 'new' })
  status: string

  @Column('text', { name: 'comment', nullable: true })
  comment: string

  @Column({ name: 'reviewer_uuid', length: 36, nullable: true })
  reviewer_uuid: string

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewed_at: Date

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date
}
