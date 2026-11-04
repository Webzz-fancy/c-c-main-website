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

/**
 * Content Security Policy. Scripts run only from this site, plus the one-line
 * inline script in index.html, allowed by its hash (read from the build so it
 * can never drift; restart the app after a rebuild, as a deploy does). Nothing else may load code, frame the site or receive a
 * form. If the quiz's API ever moves to another origin (VITE_API_BASE_URL),
 * that origin is allowed to receive requests too.
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
function apiOrigin() {
  try {
    return process.env.VITE_API_BASE_URL ? new URL(process.env.VITE_API_BASE_URL).origin : ''
  } catch {
    return ''
  }
}
const CSP = [
  "default-src 'self'",
  // wasm: the 3D robot's model decoder is WebAssembly; this allows no JS eval
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
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), interest-cohort=()',
  )
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
// The site takes no form submissions yet: contact is by booking link, email
// and WhatsApp. When the quiz email endpoint is built, follow "Abuse and
// security" in docs/quiz-backend.md (body limit, proxy-aware rate limit,
// honeypot, per-address caps) before it goes live.

app.use('/api', (_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex')
  res.set('Cache-Control', 'no-store')
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
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

// Anything that throws gets a plain 500, never a stack trace or file path.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  if (res.headersSent) return
  res.set('Cache-Control', 'no-store')
  res.status(err.status && err.status < 500 ? err.status : 500).type('text/plain').send('Something went wrong.')
})

// Surface crashes in the host's log. After an uncaught exception the process
// can't be trusted, so it exits and Passenger starts a fresh one.
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err))
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})

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
