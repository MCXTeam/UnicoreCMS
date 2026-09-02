import {
  applyNonce,
  contentSecurityPolicy,
  generateNonce,
  securityHeaders,
  CONTENT_SECURITY_POLICY_HEADER,
} from 'unicore-common/security'

const HTML_PARTS = ['head', 'bodyPrepend', 'body', 'bodyAppend'] as const

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', (event) => {
    for (const [name, value] of Object.entries(securityHeaders())) setResponseHeader(event, name, value)
  })

  nitro.hooks.hook('render:html', (html, { event }) => {
    const nonce = generateNonce()
    const apiBaseurl = String(useRuntimeConfig(event).public.apiBaseurl || '')

    for (const part of HTML_PARTS) html[part] = html[part].map((chunk) => applyNonce(chunk, nonce))

    setResponseHeader(event, CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy({ nonce, apiBaseurl }))
  })
})
