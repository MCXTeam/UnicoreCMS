import sanitize from 'sanitize-html';
import { SANITIZE_HTML_OPTIONS } from 'unicore-common';
import { Transform } from 'class-transformer';

export function sanitizeHtml(html: string): string {
  return sanitize(html, SANITIZE_HTML_OPTIONS);
}

export function SanitizeHtml(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? sanitizeHtml(value) : value));
}
