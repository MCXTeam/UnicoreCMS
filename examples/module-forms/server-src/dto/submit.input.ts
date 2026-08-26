import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'
import { SUBMISSION_STATUSES } from '../../shared/constants'

export class SubmitInput {
  @IsObject()
  answers: Record<string, unknown>

  @IsOptional()
  @IsString()
  @MaxLength(32)
  username?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string
}

export class ReviewInput {
  @IsIn(SUBMISSION_STATUSES.map((item) => item.value))
  status: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string
}
