import { HTML_ESCAPE_MAP, HTML_ESCAPE_PATTERN } from '../constants';

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPE_MAP[char]);
}
