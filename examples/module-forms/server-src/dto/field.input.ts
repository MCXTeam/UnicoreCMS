import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator'
import { FIELD_KEY_PATTERN, OPTION_LABEL_LIMIT } from '../../shared/constants'

export class FieldOptionInput {
  @IsString()
  @MaxLength(OPTION_LABEL_LIMIT)
  value: string

  @IsString()
  @MaxLength(OPTION_LABEL_LIMIT)
  label: string
}

export class FieldConditionInput {
  @IsString()
  @MaxLength(48)
  field: string

  @IsString()
  @MaxLength(16)
  op: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  value?: string
}

export class FieldInput {
  @IsOptional()
  @IsInt()
  id?: number

  @Matches(FIELD_KEY_PATTERN)
  key: string

  @IsString()
  @MaxLength(24)
  type: string

  @IsString()
  @MaxLength(160)
  label: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hint?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeholder?: string

  @IsOptional()
  @IsBoolean()
  required?: boolean

  @IsOptional()
  @IsBoolean()
  half?: boolean

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionInput)
  options?: FieldOptionInput[]

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldConditionInput)
  visible_if?: FieldConditionInput
}
