import { configuredPorts, ports } from 'unicore-common/ports'

const port = configuredPorts.frontend

if (port) {
  process.env.PORT = String(port)
  process.env.NITRO_PORT = String(port)
} else if (!process.env.PORT && !process.env.NITRO_PORT) {
  process.env.PORT = String(ports.frontendPort)
}

if (!process.env.HOST && !process.env.NITRO_HOST) process.env.HOST = '0.0.0.0'

await import('./.output/server/index.mjs')
