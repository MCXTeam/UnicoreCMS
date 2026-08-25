export type WebhookChannelField = "url" | "target";

export const WEBHOOK_CHANNEL_FIELDS: Record<
  string,
  readonly WebhookChannelField[]
> = {
  discord: ["url"],
  json: ["url"],
  telegram: ["target"],
  vk: ["target"],
};

export function webhookChannelFields(request: string): WebhookChannelField[] {
  return WEBHOOK_CHANNEL_FIELDS[request]?.slice() ?? [];
}

export function webhookChannelNeeds(
  request: string,
  field: WebhookChannelField,
): boolean {
  if (!request) return false;

  const fields = webhookChannelFields(request);

  return fields.length ? fields.includes(field) : true;
}
