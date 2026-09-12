import sanitize from 'sanitize-html';
import { SANITIZE_HTML_OPTIONS } from 'unicore-common';
import { Transform } from 'class-transformer';
import type { SanitizeNarrow } from 'unicore-api/server';

const narrowed = (narrow?: SanitizeNarrow): typeof SANITIZE_HTML_OPTIONS => {
  const denyTags = narrow?.denyTags || [];
  const denyAttributes = narrow?.denyAttributes || [];

  if (!denyTags.length && !denyAttributes.length) return SANITIZE_HTML_OPTIONS;

  return {
    ...SANITIZE_HTML_OPTIONS,
    allowedTags: SANITIZE_HTML_OPTIONS.allowedTags.filter((tag) => !denyTags.includes(tag)),
    allowedAttributes: {
      '*': SANITIZE_HTML_OPTIONS.allowedAttributes['*'].filter((attr) => !denyAttributes.includes(attr)),
    },
  };
};

export function sanitizeHtml(html: string, narrow?: SanitizeNarrow): string {
  return sanitize(html, narrowed(narrow));
}

export function SanitizeHtml(narrow?: SanitizeNarrow): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? sanitizeHtml(value, narrow) : value));
}
