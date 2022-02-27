import { IsDefined, IsEnum, IsString, IsUrl } from 'class-validator';
import { WebhookRequestType } from '../enums/webhook-request-type';
import { WebhookType } from '../enums/webhook-type.enum';

export class WebhookInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsEnum(WebhookType)
  type: WebhookType;

  @IsDefined()
  @IsEnum(WebhookRequestType)
  request: WebhookRequestType;

  @IsDefined()
  @IsUrl()
  url: string;
}
