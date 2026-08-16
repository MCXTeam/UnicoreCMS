import { SocialFormat } from './social-format.enum';

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

const DROPPED_CONTENT_TAGS = ['script', 'style', 'head', 'iframe', 'object', 'embed', 'noscript'];
const BLOCK_TAGS = ['p', 'div', 'section', 'article', 'header', 'footer', 'table', 'tr', 'figure', 'figcaption'];
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const DISCORD_ESCAPE_PATTERN = /([\\*_~`|>])/g;
const TELEGRAM_ESCAPE_PATTERN = /[&<>]/g;
const TAG_SPLIT_PATTERN = /(<[^>]*>)/;
const TAG_NAME_PATTERN = /^<\/?\s*([a-zA-Z0-9]+)/;
const HREF_PATTERN = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i;
const DROPPED_BLOCK_PATTERN = new RegExp(`<(${DROPPED_CONTENT_TAGS.join('|')})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi');
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const EXCESS_NEWLINES_PATTERN = /\n{3,}/g;
const TRAILING_SPACES_PATTERN = /[ \t]+$/gm;
const INTERBLOCK_SPACE_PATTERN = /^\s*\n\s*$/;

interface ListState {
  ordered: boolean;
  index: number;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITIES[String(name).toLowerCase()] ?? match);
}

function escapeText(value: string, format: SocialFormat): string {
  if (format === SocialFormat.DiscordMarkdown) return value.replace(DISCORD_ESCAPE_PATTERN, '\\$1');
  if (format === SocialFormat.TelegramHtml) return value.replace(TELEGRAM_ESCAPE_PATTERN, (char) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt' }[char]};`);

  return value;
}

function marker(tag: string, format: SocialFormat, closing: boolean): string {
  if (format === SocialFormat.PlainText) return '';

  if (format === SocialFormat.TelegramHtml) {
    switch (tag) {
      case 'b':
      case 'strong':
        return closing ? '</b>' : '<b>';
      case 'i':
      case 'em':
        return closing ? '</i>' : '<i>';
      case 'u':
      case 'ins':
        return closing ? '</u>' : '<u>';
      case 's':
      case 'strike':
      case 'del':
        return closing ? '</s>' : '<s>';
      case 'code':
        return closing ? '</code>' : '<code>';
      case 'pre':
        return closing ? '</pre>' : '<pre>';
      case 'blockquote':
        return closing ? '</blockquote>' : '<blockquote>';
      default:
        return '';
    }
  }

  switch (tag) {
    case 'b':
    case 'strong':
      return '**';
    case 'i':
    case 'em':
      return '*';
    case 'u':
    case 'ins':
      return '__';
    case 's':
    case 'strike':
    case 'del':
      return '~~';
    case 'code':
      return '`';
    case 'pre':
      return '```';
    default:
      return '';
  }
}

function headingOpen(format: SocialFormat): string {
  if (format === SocialFormat.TelegramHtml) return '<b>';
  if (format === SocialFormat.DiscordMarkdown) return '**';

  return '';
}

function headingClose(format: SocialFormat): string {
  if (format === SocialFormat.TelegramHtml) return '</b>';
  if (format === SocialFormat.DiscordMarkdown) return '**';

  return '';
}

function link(href: string, text: string, format: SocialFormat): string {
  if (!href) return text;
  if (format === SocialFormat.TelegramHtml) return `<a href="${escapeText(href, format)}">${text}</a>`;
  if (format === SocialFormat.DiscordMarkdown) return `[${text}](${href})`;

  return text && text !== href ? `${text} (${href})` : href;
}

export function htmlToSocial(html: string, format: SocialFormat): string {
  if (!html) return '';

  const tokens = html.replace(DROPPED_BLOCK_PATTERN, '').replace(COMMENT_PATTERN, '').split(TAG_SPLIT_PATTERN);
  const lists: ListState[] = [];

  let result = '';
  let linkHref: string = null;
  let linkText = '';

  const push = (value: string) => {
    if (linkHref !== null) linkText += value;
    else result += value;
  };

  for (const token of tokens) {
    if (!token) continue;

    if (!token.startsWith('<')) {
      if (INTERBLOCK_SPACE_PATTERN.test(token)) continue;

      push(escapeText(decodeEntities(token).replace(/\s*\n\s*/g, ' '), format));
      continue;
    }

    const match = token.match(TAG_NAME_PATTERN);

    if (!match) continue;

    const tag = match[1].toLowerCase();
    const closing = token.startsWith('</');

    if (tag === 'br') {
      push('\n');
      continue;
    }

    if (tag === 'a') {
      if (closing) {
        const href = linkHref;
        const text = linkText.trim();

        linkHref = null;
        linkText = '';
        result += link(href, text || href, format);
      } else {
        const href = token.match(HREF_PATTERN);

        linkHref = href ? decodeEntities(href[2] ?? href[3] ?? href[4] ?? '') : '';
        linkText = '';
      }
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      if (closing) lists.pop();
      else lists.push({ ordered: tag === 'ol', index: 0 });

      push('\n');
      continue;
    }

    if (tag === 'li') {
      if (closing) {
        push('\n');
        continue;
      }

      const list = lists[lists.length - 1];
      const indent = '  '.repeat(Math.max(lists.length - 1, 0));

      if (list?.ordered) {
        list.index += 1;
        push(`${indent}${list.index}. `);
      } else {
        push(`${indent}• `);
      }
      continue;
    }

    if (HEADING_TAGS.includes(tag)) {
      push(closing ? `${headingClose(format)}\n\n` : `\n\n${headingOpen(format)}`);
      continue;
    }

    if (tag === 'blockquote' && format === SocialFormat.DiscordMarkdown) {
      push(closing ? '\n' : '\n> ');
      continue;
    }

    const inline = marker(tag, format, closing);

    if (inline) {
      push(inline);
      continue;
    }

    if (BLOCK_TAGS.includes(tag) || tag === 'blockquote') push('\n\n');
  }

  if (linkHref !== null) result += link(linkHref, linkText.trim() || linkHref, format);

  return result.replace(TRAILING_SPACES_PATTERN, '').replace(EXCESS_NEWLINES_PATTERN, '\n\n').trim();
}

export function truncate(value: string, limit: number, suffix = '…'): string {
  if (!value || value.length <= limit) return value;

  return value.slice(0, Math.max(limit - suffix.length, 0)).trimEnd() + suffix;
}
