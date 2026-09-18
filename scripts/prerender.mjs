/**
 * Pre-render — runs after `vite build` (see package.json "build").
 *
 * The site is a single page app whose content is drawn behind a loading
 * screen, so a crawler (or an AI assistant fetching the URL) that does not
 * run JavaScript would see an empty <div id="root">. This step writes one
 * HTML file per URL into dist/, each with:
 *
 *   · the page's own <title>, description, canonical, robots, Open Graph and
 *     Twitter card, and the JSON-LD graph (from src/config/seo.ts), so the
 *     right metadata is in the raw HTML;
 *   · a plain, semantic copy of the page's content inside #root (headings,
 *     paragraphs, lists, links) — what the page says, in reading order.
 *     React replaces it on mount; a crawler reads it as the page.
 *
 * dist/index.html  →  /            dist/simple/index.html  →  /simple/
 *                                    dist/complex/index.html →  /complex/
 *
 * Also writes sitemap.xml, robots.txt and llms.txt.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const dist = join(root, 'dist')

// ---------------------------------------------------------------------------
// load src/config/seo.ts + src/content/static.ts through vite (TypeScript,
// import.meta.env) into a temporary node bundle
// ---------------------------------------------------------------------------
const tmpDir = join(root, 'node_modules', '.tmp', 'prerender')
mkdirSync(tmpDir, { recursive: true })
await build({
  root,
  logLevel: 'error',
  configFile: false,
  envPrefix: 'VITE_',
  build: {
    ssr: 'src/content/static.ts',
    outDir: tmpDir,
    emptyOutDir: true,
    minify: false,
    rollupOptions: { output: { format: 'es', entryFileNames: 'static.mjs' } },
  },
})
const mod = await import(join(tmpDir, 'static.mjs') + `?t=${Date.now()}`)
const { PAGES, ORIGIN, jsonLdFor, absolute, staticHtml, llmsTxt } = mod

// ---------------------------------------------------------------------------
// the built shell: vite's dist/index.html carries the hashed asset tags
// ---------------------------------------------------------------------------
const shell = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function headFor(page) {
  const url = absolute(page.path)
  const image = absolute(page.image)
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:site_name" content="Clause &amp; Code" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${esc(page.imageAlt)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(page.imageAlt)}" />`,
    `<script type="application/ld+json" id="cc-jsonld">${JSON.stringify(jsonLdFor(page)).replace(/</g, '\\u003c')}</script>`,
  ]
  return tags.map((t) => '    ' + t).join('\n')
}

function pageHtml(page) {
  let html = shell
  // the shell's generic title/description → this page's head block
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/, '')
  html = html.replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
  html = html.replace('<!--head-->', '\n' + headFor(page))
  html = html.replace('<div id="root"></div>', `<div id="root">${staticHtml(page)}</div>`)
  return html
}

for (const page of Object.values(PAGES)) {
  const out = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path.replace(/^\/|\/$/g, ''), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, pageHtml(page))
  console.log('prerender', page.path, '→', out.replace(root + '/', ''))
}

// ---------------------------------------------------------------------------
// sitemap.xml · robots.txt · llms.txt
// ---------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10)
const indexable = Object.values(PAGES).filter((p) => !p.noindex)
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  indexable
    .map(
      (p) =>
        `  <url>\n    <loc>${absolute(p.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.path === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${p.path === '/' ? '1.0' : '0.8'}</priority>\n    <image:image>\n      <image:loc>${absolute(p.image)}</image:loc>\n      <image:title>${esc(p.imageAlt)}</image:title>\n    </image:image>\n  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

const robots =
  `# Clause & Code — https://clauseandcode.com\n` +
  `User-agent: *\nAllow: /\nDisallow: /api/\n\n` +
  `# AI assistants and their crawlers are welcome to read and cite the site\n` +
  ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'Google-Extended', 'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Applebot-Extended', 'CCBot', 'Bytespider', 'meta-externalagent']
    .map((ua) => `User-agent: ${ua}\nAllow: /`)
    .join('\n\n') +
  `\n\nSitemap: ${ORIGIN}/sitemap.xml\n`
writeFileSync(join(dist, 'robots.txt'), robots)

writeFileSync(join(dist, 'llms.txt'), llmsTxt())
console.log('prerender sitemap.xml robots.txt llms.txt')
