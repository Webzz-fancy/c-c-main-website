/**
 * Production server for Clause & Code.
 *
 * Serves the built SPA from ./dist and gives the future backend a place to
 * live. This is the app entry point — Hostinger's panel, Phusion Passenger and
 * `npm start` all resolve to this file.
 *
 * NOTE: this file is deliberately CommonJS (`.cjs` semantics via require).
 * Passenger loads the entry file with require(), and Node 18 cannot require()
 * an ES module — doing so throws ERR_REQUIRE_ESM and the app 503s on boot.
 * The frontend in src/ is still modern ESM; only this server file is CJS.
 */

const express = require('express')
const compression = require('compression')
const fs = require('node:fs')
const path = require('node:path')

const distDir = path.join(__dirname, 'dist')

// Fail loudly and clearly if the frontend was never built, rather than
// serving a blank page.
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error(
    `[clause-code] dist/index.html not found at ${distDir}.\n` +
      '  Run `npm run build` (or reinstall, which triggers postinstall).',
  )
}

const app = express()

/**
 * Passenger sets PORT to a Unix socket path rather than a number, and calling
 * listen(socketPath, host) throws. Detect which one we were given.
 */
const rawPort = process.env.PORT || 3000
const isSocket = typeof rawPort === 'string' && Number.isNaN(Number(rawPort))
const PORT = isSocket ? rawPort : Number(rawPort)
const HOST = process.env.HOST || '0.0.0.0'

app.disable('x-powered-by')
app.use(compression())
app.use(express.json())

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'clause-and-code', time: new Date().toISOString() })
})

/**
 * Placeholder endpoints for the two lead forms. They validate and log for now;
 * swap the body for an email send or DB insert when that is ready.
 */
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {}

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'name, email and message are required' })
  }

  console.log('[contact]', { name, email })
  res.status(202).json({ ok: true })
})

app.post('/api/drop-problem', (req, res) => {
  const { email, problem } = req.body || {}

  if (!email || !problem) {
    return res.status(400).json({ ok: false, error: 'email and problem are required' })
  }

  console.log('[drop-problem]', { email })
  res.status(202).json({ ok: true })
})

// ---------------------------------------------------------------------------
// Static site
// ---------------------------------------------------------------------------

// Hashed assets are immutable; everything else revalidates.
app.use(
  express.static(distDir, {
    maxAge: '1y',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  }),
)

// SPA fallback — any non-API route returns index.html.
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found' }))

// Surface crashes in the host's log instead of dying silently.
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err))
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err))

const server = isSocket ? app.listen(PORT) : app.listen(PORT, HOST)

server.on('listening', () => {
  console.log(
    isSocket
      ? `Clause & Code listening on socket ${PORT}`
      : `Clause & Code running on http://${HOST}:${PORT}`,
  )
})

server.on('error', (err) => {
  console.error('[clause-code] failed to start:', err)
  process.exit(1)
})

module.exports = app
