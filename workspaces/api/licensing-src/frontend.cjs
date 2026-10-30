const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const net = require('node:net')
const { spawn } = require('node:child_process')
const { prepareLicenses } = require('./index.cjs')

async function freePort() {
  const server = net.createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
async function childReady(child, port) {
  for (let i = 0; i < 300; i++) {
    if (child.exitCode !== null) throw new Error('frontend_worker_stopped')
    const ready = await new Promise((resolve) => {
      const socket = net.connect(port, '127.0.0.1')
      socket.setTimeout(100)
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('error', () => resolve(false))
      socket.once('timeout', () => {
        socket.destroy()
        resolve(false)
      })
    })
    if (ready) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  child.kill()
  throw new Error('frontend_worker_timeout')
}
async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve()
    }, 3000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    child.kill()
  })
}

async function startFrontend({ workspace, dataRoot, port, host, metadata: supplied }) {
  const output = path.join(workspace, '.output'),
    filename = path.join(output, 'licensing.json')
  if (!supplied && !fs.existsSync(filename)) return false
  const metadata = supplied || JSON.parse(fs.readFileSync(filename, 'utf8'))
  if (metadata.schema !== 1 || !Array.isArray(metadata.modules)) throw new Error('invalid_frontend_license_metadata')
  if (metadata.modules.length && (!metadata.browserOnly || !metadata.moduleBindings))
    throw new Error('commercial_frontend_browser_required')
  host = host || (await prepareLicenses(dataRoot))
  const children = new Set()
  const tunnels = new Set()
  let primary = null,
    fallback = null,
    closed = false
  const launch = async (relative) => {
    const entry = path.join(output, relative)
    if (!fs.existsSync(entry)) throw new Error('frontend_fallback_missing')
    const childPort = await freePort()
    const child = spawn(process.execPath, [entry], {
      cwd: workspace,
      windowsHide: true,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: {
        ...process.env,
        UNICORE_DATA_ROOT: dataRoot,
        HOST: '127.0.0.1',
        NITRO_HOST: '127.0.0.1',
        PORT: String(childPort),
        NITRO_PORT: String(childPort),
      },
    })
    child.on('error', () => {})
    children.add(child)
    child.once('exit', () => children.delete(child))
    try {
      await childReady(child, childPort)
    } catch (error) {
      await stopChild(child)
      throw error
    }
    return { child, port: childPort }
  }
  const themeAllowed = async () => {
    if (!metadata.theme) return true
    try {
      await host.requireLive('theme', metadata.theme.id)
      const entry = host.entries.get(`theme:${metadata.theme.id}`)
      return entry?.artifactDigest === metadata.theme.artifactDigest && entry.releaseId === metadata.theme.releaseId
    } catch {
      return false
    }
  }
  try {
    if (metadata.theme) fallback = await launch('fallback/server/index.mjs')
    if (await themeAllowed())
      try {
        primary = await launch(metadata.theme ? 'primary/server/index.mjs' : 'server/runtime.mjs')
      } catch (error) {
        if (!fallback) throw error
      }
    if (!primary && !fallback) throw new Error('frontend_unavailable')
  } catch (error) {
    await Promise.all([...children].map(stopChild))
    throw error
  }
  const stopPrimary = () => {
    if (primary) {
      primary.child.kill('SIGKILL')
      primary = null
    }
  }
  const moduleAllowed = (id) => {
    const entry = host.entries.get(`module:${id}`),
      bound = metadata.moduleBindings?.[id]
    return (
      host.allowedKey(`module:${id}`) && bound && entry?.releaseId === bound.releaseId && entry?.artifactDigest === bound.artifactDigest
    )
  }
  const unsubscribe = host.onBlocked((key) => {
    if (metadata.theme && key === `theme:${metadata.theme.id}`) stopPrimary()
    for (const tunnel of tunnels)
      if (tunnel.keys.includes(key)) {
        tunnel.socket.destroy()
        tunnel.upstream.destroy()
      }
  })
  const choose = async (request) => {
    const id = String(request.url || '')
      .split('?')[0]
      .toLowerCase()
      .match(/^\/mod\/([a-z][a-z0-9_]{2,31})(?:\/|$)/)?.[1]
    if (id && metadata.modules.includes(id))
      try {
        await host.requireLive('module', id)
        if (!moduleAllowed(id)) return null
      } catch {
        return null
      }
    if (metadata.theme && !(await themeAllowed())) {
      stopPrimary()
      return fallback
    }
    if (primary && primary.child.exitCode === null) return primary
    return fallback
  }
  const server = http.createServer(async (request, response) => {
    if (request.url === '/__unicore/license-state') {
      const allowed = await themeAllowed()
      response.setHeader('content-type', 'application/json')
      response.setHeader('cache-control', 'no-store')
      response.end(JSON.stringify({ themeAllowed: allowed, blockedModules: metadata.modules.filter((id) => !moduleAllowed(id)) }))
      return
    }
    const target = await choose(request)
    if (!target) {
      response.writeHead(403, { 'content-type': 'application/json', 'cache-control': 'no-store' })
      response.end('{"message":"extension_license_required"}')
      return
    }
    const upstream = http.request(
      { host: '127.0.0.1', port: target.port, method: request.method, path: request.url, headers: request.headers },
      (incoming) => {
        response.writeHead(incoming.statusCode, {
          ...incoming.headers,
          ...(target === fallback ? { 'x-unicore-theme-fallback': '1', 'cache-control': 'no-store' } : {}),
        })
        incoming.pipe(response)
        incoming.once('aborted', () => response.destroy())
        incoming.once('error', () => response.destroy())
      },
    )
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(503)
      response.end()
    })
    response.once('close', () => upstream.destroy())
    request.on('error', () => upstream.destroy())
    request.pipe(upstream)
  })
  server.on('upgrade', async (request, socket, head) => {
    const target = await choose(request)
    if (!target) {
      socket.destroy()
      return
    }
    const upstream = net.connect(target.port, '127.0.0.1', () => {
      const headers = Object.entries(request.headers)
        .flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map((item) => `${key}: ${item}`))
        .join('\r\n')
      upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers}\r\n\r\n`)
      if (head.length) upstream.write(head)
      socket.pipe(upstream).pipe(socket)
    })
    const id = String(request.url || '')
      .split('?')[0]
      .toLowerCase()
      .match(/^\/mod\/([a-z][a-z0-9_]{2,31})(?:\/|$)/)?.[1]
    const tunnel = {
      socket,
      upstream,
      keys: [
        ...(id && metadata.modules.includes(id) ? [`module:${id}`] : []),
        ...(metadata.theme && target === primary ? [`theme:${metadata.theme.id}`] : []),
      ],
    }
    tunnels.add(tunnel)
    socket.once('close', () => {
      tunnels.delete(tunnel)
      upstream.destroy()
    })
    upstream.on('error', () => socket.destroy())
    socket.on('error', () => upstream.destroy())
  })
  const tunnelTimer = setInterval(() => {
    for (const tunnel of tunnels)
      if (tunnel.keys.some((key) => !host.allowedKey(key))) {
        tunnel.socket.destroy()
        tunnel.upstream.destroy()
      }
  }, 1000)
  tunnelTimer.unref()
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, process.env.HOST || '0.0.0.0', resolve)
    })
  } catch (error) {
    clearInterval(tunnelTimer)
    unsubscribe()
    await Promise.all([...children].map(stopChild))
    throw error
  }
  const close = async () => {
    if (closed) return
    closed = true
    unsubscribe()
    clearInterval(tunnelTimer)
    for (const tunnel of tunnels) {
      tunnel.socket.destroy()
      tunnel.upstream.destroy()
    }
    await Promise.all([...children].map(stopChild))
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    for (const signal of ['SIGINT', 'SIGTERM']) process.removeListener(signal, shutdown)
  }
  const shutdown = () => close().finally(() => process.exit())
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, shutdown)
  return { server, close }
}

module.exports = { startFrontend }
