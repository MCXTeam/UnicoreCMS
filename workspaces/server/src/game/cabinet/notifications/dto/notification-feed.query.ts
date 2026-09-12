import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { NOTIFICATION_MAX_PAGE_SIZE, NOTIFICATION_PAGE_SIZE } from 'unicore-common';

export class NotificationFeedQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page? = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(NOTIFICATION_MAX_PAGE_SIZE)
  limit? = NOTIFICATION_PAGE_SIZE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  before?: number;
}
