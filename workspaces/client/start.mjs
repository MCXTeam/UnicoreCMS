import { configuredPorts, loadEnvFile, ports } from 'unicore-common/ports'

loadEnvFile()

const port = configuredPorts.frontend

if (port) {
  process.env.PORT = String(port)
  process.env.NITRO_PORT = String(port)
} else if (!process.env.PORT && !process.env.NITRO_PORT) {
  process.env.PORT = String(ports.frontendPort)
}

if (!process.env.HOST && !process.env.NITRO_HOST) process.env.HOST = '0.0.0.0'

const { publicRuntimeEnv } = await import('unicore-common/public-config')

const runtimeEnv = publicRuntimeEnv()

for (const [key, value] of Object.entries(runtimeEnv)) {
  if (process.env[key] === undefined) process.env[key] = value
}

if (process.env.NUXT_SITE_URL === undefined) process.env.NUXT_SITE_URL = runtimeEnv.NUXT_PUBLIC_BASEURL

const entry = './.output/server/index.mjs'

await import(entry)
