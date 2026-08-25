import { NAME_MAX_LENGTH, TOKEN_MAX_LENGTH, WEBHOOK_TARGET_MAX_LENGTH } from '@common';
import { webhookChannelNeeds } from 'unicore-common';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { IsWebhookChannel } from '../webhook-channels';
import { WebhookType } from '../enums/webhook-type.enum';

export class WebhookInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsEnum(WebhookType)
  type: WebhookType;

  @IsDefined()
  @IsWebhookChannel()
  request: WebhookRequestType;

  @ValidateIf((input: WebhookInput) => webhookChannelNeeds(input.request, 'url'))
  @IsOptional()
  @IsUrl()
  @MaxLength(TOKEN_MAX_LENGTH)
  url?: string;

  @ValidateIf((input: WebhookInput) => webhookChannelNeeds(input.request, 'target'))
  @IsOptional()
  @IsString()
  @MaxLength(WEBHOOK_TARGET_MAX_LENGTH)
  target?: string;

  @IsOptional()
  @IsBoolean()
  auto_publish?: boolean;

  @IsOptional()
  @IsBoolean()
  update_on_edit?: boolean;
}
