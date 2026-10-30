import { configuredPorts, loadPublicEnvFile, ports, dataRoot } from 'unicore-common/ports'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareLicenses, startFrontend } from 'unicore-api/licensing'

loadPublicEnvFile()

const port = configuredPorts.admin

if (port) {
  process.env.PORT = String(port)
  process.env.NITRO_PORT = String(port)
} else if (!process.env.PORT && !process.env.NITRO_PORT) {
  process.env.PORT = String(ports.adminPort)
}

if (!process.env.HOST && !process.env.NITRO_HOST) process.env.HOST = '0.0.0.0'

const { publicRuntimeEnv } = await import('unicore-common/public-config')

for (const [key, value] of Object.entries(publicRuntimeEnv())) {
  if (process.env[key] === undefined) process.env[key] = value
}

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
