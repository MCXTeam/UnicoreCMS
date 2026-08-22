import { escapeHtml, fillPlaceholders } from '@common';

export function renderEmailTemplate(content: string, values: Record<string, string>): string {
  return fillPlaceholders(content, values, escapeHtml);
}
