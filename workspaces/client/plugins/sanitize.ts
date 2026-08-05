import DOMPurify from 'isomorphic-dompurify'
import { SANITIZE_CONFIG } from '~/constants'

function sanitize(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

export default defineNuxtPlugin(() => {
  return { provide: { sanitize } }
})
