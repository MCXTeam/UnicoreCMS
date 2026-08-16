import { IsDateString, IsDefined, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TEXT_MAX_LENGTH } from '@common';

export class BanFromAdminInput {
  @IsDefined()
  @IsUUID()
  user_uuid: string;

  @IsOptional()
  @IsDateString()
  expires?: string;

  @IsDefined()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  reason: string;
}
