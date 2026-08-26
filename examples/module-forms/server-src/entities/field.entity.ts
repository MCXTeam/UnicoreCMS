import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Translatable } from 'unicore-api/server'
import type { FieldCondition, FieldOption, FieldSettings } from '../../shared/constants'
import { Form } from './form.entity'

@Translatable('mod.forms.field', ['label', 'hint', 'placeholder', 'options.*.label'], {
  read: ['mod.forms.read'],
  write: ['mod.forms.write'],
})
@Entity({ name: 'mod_forms_fields' })
export class FormField {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @ManyToOne(() => Form, (form) => form.fields, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'form_id' })
  form: Form

  @Column({ name: 'field_key', length: 48 })
  key: string

  @Column({ name: 'type', length: 24 })
  type: string

  @Column({ name: 'label', length: 160 })
  label: string

  @Column({ name: 'hint', length: 255, nullable: true })
  hint: string

  @Column({ name: 'placeholder', length: 120, nullable: true })
  placeholder: string

  @Column({ name: 'required', default: false })
  required: boolean

  @Column({ name: 'half', default: false })
  half: boolean

  @Column({ name: 'position', default: 0 })
  position: number

  @Column('simple-json', { name: 'options', nullable: true })
  options: FieldOption[]

  @Column('simple-json', { name: 'settings', nullable: true })
  settings: FieldSettings

  @Column('simple-json', { name: 'visible_if', nullable: true })
  visible_if: FieldCondition
}
