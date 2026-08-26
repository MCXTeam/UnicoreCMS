import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsDate, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { FORM_SLUG_PATTERN } from '../../shared/constants'
import { FieldInput } from './field.input'

const HOURS_MAX = 8760
const TOTAL_MAX = 1000000

export class FormInput {
  @IsOptional()
  @Matches(FORM_SLUG_PATTERN)
  slug?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @IsBoolean()
  in_nav?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  nav_order?: number

  @IsOptional()
  @IsBoolean()
  auth_only?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(64)
  permission?: string

  @IsOptional()
  @IsBoolean()
  once?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(HOURS_MAX)
  cooldown_hours?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(TOTAL_MAX)
  max_total?: number

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  open_from?: Date

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  open_to?: Date

  @IsOptional()
  @IsString()
  @MaxLength(255)
  closed_text?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  success_text?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  submit_label?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notify_channels?: string[]

  @IsOptional()
  @IsBoolean()
  notify_author?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldInput)
  fields?: FieldInput[]
}

export class FormCreateInput extends FormInput {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  preset?: string
}
