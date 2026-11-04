import DOMPurify from 'isomorphic-dompurify'

export const EMAIL_VARIABLES: Record<string, string[]> = {
  activations: ['CODE'],
  reset: ['LINK', 'IP'],
  device: ['IP'],
  gift: ['SENDER', 'GIFT'],
  email_change: ['CODE'],
  email_changed: ['EMAIL'],
}

export function isSimpleEmailTemplate(content: string): boolean {
  const tags = content.match(/<[^>]*>/g) || []

  return tags.every((tag) => /^<\/?(?:p|br|h[1-6]|strong|b|em|i|u|s|ol|ul|li|blockquote|pre|code)\s*\/?>$/i.test(tag))
}

export function emailPreview(content: string, sitename: string): string {
  const examples: Record<string, string> = {
    SITENAME: sitename,
    USERNAME: 'Alex',
    CODE: 'A7K9M2',
    LINK: 'https://example.com/auth/password?hash=example',
    IP: '192.0.2.42',
    SENDER: 'Steve',
    GIFT: 'VIP · 30 дней',
    EMAIL: 'alex@example.com',
  }
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
  const rendered = content.replace(/\{([A-Z_]+)\}/g, (placeholder, key) =>
    Object.prototype.hasOwnProperty.call(examples, key) ? escape(examples[key]) : placeholder,
  )
  const document = DOMPurify.sanitize(rendered, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['meta', 'base', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['href', 'action', 'formaction'],
  })
  const policy = "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; font-src 'none'; base-uri 'none'; form-action 'none'"

  return document.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1">`)
}
