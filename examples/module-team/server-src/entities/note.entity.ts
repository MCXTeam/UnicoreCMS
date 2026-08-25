import { Column, Entity, PrimaryColumn } from 'typeorm'
import { Translatable } from 'unicore-api/server'

@Translatable('mod.team.note', ['text'], { read: ['mod.team.read'], write: ['mod.team.write'] })
@Entity({ name: 'mod_team_notes' })
export class TeamNote {
  @PrimaryColumn({ name: 'id' })
  id: string

  @Column('text', { name: 'text', nullable: true })
  text: string
}
