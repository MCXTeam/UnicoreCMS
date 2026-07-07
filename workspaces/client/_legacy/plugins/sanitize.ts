import { Plugin } from '@nuxt/types'
// @ts-ignore
import DOMPurify from 'isomorphic-dompurify'

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'span', 'div',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sub', 'sup', 'small', 'mark',
    'blockquote', 'pre', 'code',
    'ol', 'ul', 'li',
    'a', 'img',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title', 'name',
    'src', 'alt', 'width', 'height',
    'class', 'style',
    'colspan', 'rowspan',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseenter', 'onfocus'],
}

function sanitize(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

declare module 'vue/types/vue' {
  interface Vue {
    $sanitize: (html: string | null | undefined) => string
  }
}

declare module '@nuxt/types' {
  interface Context {
    $sanitize: (html: string | null | undefined) => string
  }
}

const sanitizePlugin: Plugin = (_context, inject) => {
  inject('sanitize', sanitize)
}

export default sanitizePlugin
