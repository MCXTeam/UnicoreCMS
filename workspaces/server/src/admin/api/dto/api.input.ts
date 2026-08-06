import { IsArray, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { API_KEY_COMMENT_MAX_LENGTH } from '@common';

export class ApiInput {
  @IsOptional()
  @IsString()
  @MaxLength(API_KEY_COMMENT_MAX_LENGTH)
  comment?: string;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  perms: string[];

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  allow: string[];
}
