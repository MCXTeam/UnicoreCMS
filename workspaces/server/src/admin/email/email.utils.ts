import { escapeHtml } from '../../common/utils/escape-html';

function substitute(content: string, values: Record<string, string>, format: (value: string) => string): string {
  return content.replace(/\{([A-Z_]+)\}/g, (placeholder, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? format(values[key]) : placeholder,
  );
}

export function renderEmailTemplate(content: string, values: Record<string, string>): string {
  return substitute(content, values, escapeHtml);
}

export function renderEmailMessage(template: { title: string; content: string }, values: Record<string, string>) {
  return {
    subject: substitute(template.title, values, (value) => value).replace(/[\r\n]+/g, ' '),
    html: renderEmailTemplate(template.content, values),
  };
}
