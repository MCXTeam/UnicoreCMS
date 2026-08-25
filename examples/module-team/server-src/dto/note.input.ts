import { IsOptional, IsString, MaxLength } from 'class-validator'

const NOTE_MAX = 400

export class TeamNoteInput {
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_MAX)
  text?: string
}
