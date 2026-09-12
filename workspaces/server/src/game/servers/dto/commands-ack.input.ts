import { BULK_ITEMS_MAX } from '@common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';

export class CommandsAckInput {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  @Type(() => Number)
  done?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  @Type(() => Number)
  failed?: number[];
}
