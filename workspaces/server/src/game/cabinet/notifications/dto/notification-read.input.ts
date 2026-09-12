import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { BULK_ITEMS_MAX } from '@common';

export class NotificationReadInput {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  @Type(() => Number)
  ids?: number[];
}
