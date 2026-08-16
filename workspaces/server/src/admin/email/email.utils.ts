import { escapeHtml } from '@common';

export function renderEmailTemplate(content: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((html, [key, value]) => html.split(`{${key}}`).join(escapeHtml(value)), content);
}
