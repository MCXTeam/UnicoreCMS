import axios from 'axios';
import {
  DISCORD_HTTPS_PROTOCOL,
  DISCORD_MESSAGES_PATH,
  DISCORD_WAIT_PARAM,
  DISCORD_WEBHOOK_HOSTS,
  WEBHOOK_TIMEOUT_MS,
} from '../constants';

export interface DiscordEmbedAuthor {
  name: string;
  icon_url?: string;
  url?: string;
}

export interface DiscordEmbed {
  title?: string;
  url?: string;
  description?: string;
  image?: { url: string };
  author?: DiscordEmbedAuthor;
}

export interface DiscordPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordMessage {
  id: string;
}

export function discordEmbed(fields: {
  title?: string;
  url?: string;
  description?: string;
  image?: string;
  author?: DiscordEmbedAuthor;
}): DiscordEmbed {
  const embed: DiscordEmbed = {};

  if (fields.title) embed.title = fields.title;
  if (fields.url) embed.url = fields.url;
  if (fields.description) embed.description = fields.description;
  if (fields.image) embed.image = { url: fields.image };
  if (fields.author?.name) embed.author = fields.author;

  return embed;
}

export function isDiscordWebhookUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);

    if (protocol !== DISCORD_HTTPS_PROTOCOL) return false;

    return DISCORD_WEBHOOK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function messageUrl(url: string, messageId: string): string {
  return `${url.split('?')[0]}${DISCORD_MESSAGES_PATH}${encodeURIComponent(messageId)}`;
}

function waitingUrl(url: string): string {
  const parsed = new URL(url);

  parsed.searchParams.set(DISCORD_WAIT_PARAM, 'true');

  return parsed.toString();
}

export async function discordSend(url: string, payload: DiscordPayload): Promise<DiscordMessage> {
  const { data } = await axios.post<DiscordMessage>(waitingUrl(url), payload, {
    timeout: WEBHOOK_TIMEOUT_MS,
    maxRedirects: 0,
  });

  return data;
}

export async function discordEdit(url: string, messageId: string, payload: DiscordPayload): Promise<DiscordMessage> {
  const { data } = await axios.patch<DiscordMessage>(messageUrl(url, messageId), payload, {
    timeout: WEBHOOK_TIMEOUT_MS,
    maxRedirects: 0,
  });

  return data;
}

export async function discordDelete(url: string, messageId: string): Promise<void> {
  await axios.delete(messageUrl(url, messageId), { timeout: WEBHOOK_TIMEOUT_MS, maxRedirects: 0 });
}
