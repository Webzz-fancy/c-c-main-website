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
const crypto = require('node:crypto')
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
// These endpoints take a form, not a document. Capping the body keeps an
// oversized or malformed payload from ever being parsed.
app.use(express.json({ limit: '16kb' }))

/**
 * Content Security Policy. Scripts run only from this site, plus the one-line
 * inline script in index.html, allowed by its hash (read from the build at
 * startup so it can never drift; a deploy restarts the app). WebAssembly is
 * allowed for the 3D robot's model decoder; that permits no JavaScript eval.
 * Nothing else may load code, frame the site or receive a form.
 */
function inlineScriptHashes() {
  try {
    const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
    return [...html.matchAll(/<script>([^<]*)<\/script>/g)].map(
      (m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`,
    )
  } catch {
    return []
  }
}
// If the quiz's API ever moves to another origin, it may receive requests too.
function apiOrigin() {
  try {
    return process.env.VITE_API_BASE_URL ? new URL(process.env.VITE_API_BASE_URL).origin : ''
  } catch {
    return ''
  }
}
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'wasm-unsafe-eval' ${inlineScriptHashes().join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self' blob: data: ${apiOrigin()}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

// Security headers, set by hand so the app keeps to two runtime dependencies.
app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

/**
 * A small allowance per address, in memory. Enough to stop a script emptying a
 * mailbox form, and it costs nothing to run. Restarting the app clears it.
 */
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 12
const seen = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const hits = (seen.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  seen.set(ip, hits)
  if (seen.size > 5000) seen.clear()
  return hits.length > MAX_PER_WINDOW
}

const clean = (value, max) =>
  typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : ''

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.use('/api', (_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex')
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'clause-and-code', time: new Date().toISOString() })
})

/**
 * Placeholder endpoints for the two lead forms. They validate and log for now;
 * swap the body for an email send or DB insert when that is ready.
 */
app.post('/api/contact', (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const name = clean(body.name, 120)
  const email = clean(body.email, 160)
  const message = clean(body.message, 4000)

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'name, email and message are required' })
  }
  if (!EMAIL.test(email)) {
    return res.status(400).json({ ok: false, error: 'email is not a valid address' })
  }

  // Only what is needed, and never the message body, in the log.
  console.log('[contact]', { name, email, length: message.length })
  res.status(202).json({ ok: true })
})

app.post('/api/drop-problem', (req, res) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const email = clean(body.email, 160)
  const problem = clean(body.problem, 4000)

  if (!email || !problem) {
    return res.status(400).json({ ok: false, error: 'email and problem are required' })
  }
  if (!EMAIL.test(email)) {
    return res.status(400).json({ ok: false, error: 'email is not a valid address' })
  }

  console.log('[drop-problem]', { email, length: problem.length })
  res.status(202).json({ ok: true })
})

// ---------------------------------------------------------------------------
// Static site
// ---------------------------------------------------------------------------

// One preferred URL per page: /, /simple, /projects, /contact, /privacy and /terms. All internal links and metadata use the
// slashless subpage URLs. Older visitors may still have a cached permanent
// redirect FROM /simple TO /simple/, so we serve both addresses with a 200
// and a canonical pointing to /simple rather than reversing the redirect
// (which would trap those visitors in a loop). No links or sitemap entries
// point to the slash alias. The app cleans up the address bar without a trip
// to the server when someone lands on that legacy URL.
function redirectToPage(req, res, pathname) {
  const search = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''
  res.redirect(301, `${pathname}${search}`)
}

// Consolidate the www and non-www hosts when requests reach this app. The
// public site, its sitemap, and every page's canonical use the non-www host.
app.use((req, res, next) => {
  if (req.get('host')?.split(':')[0]?.toLowerCase() === 'www.clauseandcode.com') {
    return res.redirect(301, `https://clauseandcode.com${req.originalUrl}`)
  }
  next()
})

// The projects page used to live at /complex. Old links and search results
// move to /projects for good; the browser keeps any #project anchor.
app.get(/^\/complex(\/|\/index\.html)?$/i, (req, res) => redirectToPage(req, res, '/projects'))

app.get(/^\/(simple|projects|contact|privacy|terms)$/i, (req, res) => {
  const page = req.params[0].toLowerCase()
  if (req.path !== `/${page}`) return redirectToPage(req, res, `/${page}`)
  res.set('Cache-Control', 'no-cache')
  return res.sendFile(path.join(distDir, page, 'index.html'))
})
// The blog list and each post. A post exists only if the build wrote it, so
// an unknown address is a real 404, never the home page.
app.get(/^\/blog(?:\/([a-z0-9-]+))?\/?$/i, (req, res, next) => {
  const slug = req.params[0]?.toLowerCase()
  const want = slug ? `/blog/${slug}` : '/blog'
  if (req.path !== want) return redirectToPage(req, res, want)
  const file = path.join(distDir, 'blog', ...(slug ? [slug] : []), 'index.html')
  if (!fs.existsSync(file)) return next()
  res.set('Cache-Control', 'no-cache')
  return res.sendFile(file)
})
app.get(['/index.html', '/simple/index.html', '/projects/index.html', '/contact/index.html', '/privacy/index.html', '/terms/index.html'], (req, res) => {
  const page = req.path.split('/')[1].toLowerCase()
  redirectToPage(req, res, page === 'index.html' ? '/' : `/${page}`)
})

// If the 404 document itself is requested, it is still a 404, never a
// successful indexable page just because its HTML file exists on disk.
function notFound(_req, res) {
  res.set('Cache-Control', 'no-cache')
  res.set('X-Robots-Tag', 'noindex')
  res.status(404).sendFile(path.join(distDir, '404.html'))
}
app.get('/404.html', notFound)

// Caching: vite's hashed bundles (/assets/) and the fonts never change under
// the same name, so they are cached for a year. HTML and the crawler files
// (sitemap, robots, llms.txt, the IndexNow key) revalidate every time. The
// other public files (logo, robot images, OG cards) keep their names when
// they are redesigned, so they are cached for a week, not a year.
const ASSET_DIRS = [`${path.sep}assets${path.sep}`, `${path.sep}fonts${path.sep}`]
app.use(
  express.static(distDir, {
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (/\.(html|xml|txt|webmanifest)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache')
      } else if (ASSET_DIRS.some((dir) => filePath.includes(dir))) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
      // markdown for language models, served as readable UTF-8 text
      if (/llms(-full)?\.txt$/.test(filePath)) res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    },
  }),
)

// API responses are never search results.
app.use('/api', (_req, res) => {
  res.set('X-Robots-Tag', 'noindex')
  res.status(404).json({ ok: false, error: 'Not found' })
})

// Nonexistent URLs return the same branded document with a genuine HTTP 404,
// not the home page's HTML or SEO head under a misleading 200 status.
app.use(notFound)

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
