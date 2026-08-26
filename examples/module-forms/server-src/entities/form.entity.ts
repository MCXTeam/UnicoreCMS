import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Translatable } from 'unicore-api/server'
import { FormField } from './field.entity'

@Translatable('mod.forms.form', ['title', 'description', 'success_text', 'submit_label', 'closed_text'], {
  read: ['mod.forms.read'],
  write: ['mod.forms.write'],
})
@Entity({ name: 'mod_forms_forms' })
export class Form {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @Column({ name: 'slug', length: 48, unique: true })
  slug: string

  @Column({ name: 'title', length: 120 })
  title: string

  @Column('text', { name: 'description', nullable: true })
  description: string

  @Column({ name: 'icon', length: 64, nullable: true })
  icon: string

  @Column({ name: 'enabled', default: true })
  enabled: boolean

  @Column({ name: 'in_nav', default: false })
  in_nav: boolean

  @Column({ name: 'nav_order', default: 100 })
  nav_order: number

  @Column({ name: 'auth_only', default: true })
  auth_only: boolean

  @Column({ name: 'permission', length: 64, nullable: true })
  permission: string

  @Column({ name: 'once', default: false })
  once: boolean

  @Column({ name: 'cooldown_hours', default: 0 })
  cooldown_hours: number

  @Column({ name: 'max_total', default: 0 })
  max_total: number

  @Column({ name: 'open_from', type: 'datetime', nullable: true })
  open_from: Date

  @Column({ name: 'open_to', type: 'datetime', nullable: true })
  open_to: Date

  @Column({ name: 'closed_text', length: 255, nullable: true })
  closed_text: string

  @Column('text', { name: 'success_text', nullable: true })
  success_text: string

  @Column({ name: 'submit_label', length: 64, nullable: true })
  submit_label: string

  @Column('simple-array', { name: 'notify_channels', nullable: true })
  notify_channels: string[]

  @Column({ name: 'notify_author', default: true })
  notify_author: boolean

  @OneToMany(() => FormField, (field) => field.form, { cascade: true })
  fields: FormField[]

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date
}
