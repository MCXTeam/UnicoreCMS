import { configuredPorts, loadPublicEnvFile, ports, dataRoot } from 'unicore-common/ports'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareLicenses, startFrontend } from 'unicore-api/licensing'

loadPublicEnvFile()

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

const host = await prepareLicenses(dataRoot)
if (
  !(await startFrontend({
    workspace: dirname(fileURLToPath(import.meta.url)),
    dataRoot,
    port: Number(process.env.PORT || process.env.NITRO_PORT),
    host,
  }))
)
  await import(entry)
