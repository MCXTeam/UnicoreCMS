import { IsDefined, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TEXT_MAX_LENGTH } from '@common';

export class BanInput {
  @IsDefined()
  @IsUUID()
  user_uuid: string;

  @IsOptional()
  @IsUUID()
  actor_uuid?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expires?: number;

  @IsDefined()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  reason: string;
}
