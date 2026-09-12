import { IsBoolean, IsDefined, IsString, MaxLength } from 'class-validator';
import { NOTIFICATION_CATEGORY_MAX_LENGTH } from 'unicore-common';

export class NotificationSettingInput {
  @IsDefined()
  @IsString()
  @MaxLength(NOTIFICATION_CATEGORY_MAX_LENGTH)
  category: string;

  @IsDefined()
  @IsBoolean()
  enabled: boolean;
}
