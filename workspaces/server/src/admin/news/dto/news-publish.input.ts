import { ArrayMaxSize, IsArray, IsDefined, IsEnum, IsInt, IsOptional } from 'class-validator';
import { BULK_ITEMS_MAX } from '@common';
import { PublishMode } from 'src/admin/webhook/webhook-deliveries.service';

export class NewsPublishInput {
  @IsDefined()
  @IsEnum(PublishMode)
  mode: PublishMode;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BULK_ITEMS_MAX)
  @IsInt({ each: true })
  webhooks?: number[];
}
