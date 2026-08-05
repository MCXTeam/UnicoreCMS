import { configuredPorts, loadEnvFile, ports } from 'unicore-common/ports'

loadEnvFile()

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

await import(entry)
