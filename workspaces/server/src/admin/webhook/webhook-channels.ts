import { registerDecorator, ValidationOptions } from 'class-validator';
import { moduleWebhookChannels } from 'src/modules/runtime';
import { WebhookRequestType } from './enums/webhook-request-type';

export const webhookChannelIds = (): string[] => [
  ...Object.values(WebhookRequestType),
  ...(moduleWebhookChannels() as { request?: string }[]).map((channel) => String(channel?.request || '')).filter(Boolean),
];

export function IsWebhookChannel(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWebhookChannel',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && webhookChannelIds().includes(value);
        },
        defaultMessage() {
          return `request должен быть одним из каналов: ${webhookChannelIds().join(', ')}`;
        },
      },
    });
  };
}
