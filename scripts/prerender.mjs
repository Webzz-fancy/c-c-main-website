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
 *   · a plain, semantic copy of the page's content beside #root (headings,
 *     paragraphs, lists, links) — what the page says, in reading order.
 *     React removes it when the real page mounts; crawlers can read it even
 *     while the home page's loading screen is running.
 *
 * dist/index.html  →  /            dist/simple/index.html  →  /simple
 *                                    dist/projects/index.html →  /projects
 *                                    dist/contact/index.html →  /contact
 *                                    dist/blog/index.html    →  /blog
 *                                    dist/blog/<slug>/index.html → /blog/<slug>
 *
 * Also writes sitemap.xml (lastmod from git), robots.txt, llms.txt and
 * llms-full.txt.
 *
 * Optional env vars, read at build time (set them on the host, never commit
 * them as fake values):
 *   GOOGLE_SITE_VERIFICATION  the content of Search Console's HTML tag
 *   BING_SITE_VERIFICATION    the content of Bing Webmaster Tools' msvalidate.01 tag
 * When set, the tag goes into the home page's head. DNS verification needs
 * neither.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
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
const { ALL_PAGES, ORIGIN, jsonLdFor, absolute, staticHtml, llmsTxt } = mod

// ---------------------------------------------------------------------------
// the built shell: vite's dist/index.html carries the hashed asset tags
// ---------------------------------------------------------------------------
const shell = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const verification = [
  ['google-site-verification', process.env.GOOGLE_SITE_VERIFICATION],
  ['msvalidate.01', process.env.BING_SITE_VERIFICATION],
].filter(([, v]) => v)

function headFor(page) {
  const url = absolute(page.path)
  const isHome = page.path === '/'
  const image = absolute(page.image)
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.type}" />`,
    ...(page.post ? [`<meta property="article:published_time" content="${page.post.date}" />`, `<meta property="article:modified_time" content="${page.post.updated ?? page.post.date}" />`] : []),
    `<meta property="og:site_name" content="Clause &amp; Code" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:alt" content="${esc(page.imageAlt)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(page.imageAlt)}" />`,
    `<link rel="alternate" type="text/plain" href="${ORIGIN}/llms.txt" title="llms.txt" />`,
    ...(isHome ? verification.map(([name, v]) => `<meta name="${name}" content="${esc(v)}" />`) : []),
    // the home hero's robot is the first thing painted after the loader
    // (which waits for it), so fetch it with the fonts, not after the JS
    ...(isHome
      ? [
          `<link rel="preload" as="image" type="image/webp" href="/robot-hero-body.webp" fetchpriority="high" />`,
          `<link rel="preload" as="image" type="image/webp" href="/robot-hero-head.webp" fetchpriority="high" />`,
        ]
      : []),
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
  // Keep the actual content OUTSIDE the React root: the home page delays its
  // React content until the loader finishes. If the prerender lived inside
  // #root, a JS crawler arriving during that loader would see only "0%".
  // App removes #prerender once the real page has mounted. Without JS, the
  // copy stays readable as a genuine fallback.
  html = html.replace('<div id="root"></div>', `<div id="prerender">${staticHtml(page)}</div><div id="root"></div>`)
  return html
}

for (const page of ALL_PAGES) {
  const out = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path.replace(/^\/|\/$/g, ''), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, pageHtml(page))
  console.log('prerender', page.path, '→', out.replace(root + '/', ''))
}

// ---------------------------------------------------------------------------
// sitemap.xml · robots.txt · llms.txt
// ---------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10)

/** the files each page's content comes from: its lastmod is the date of the
 *  last commit that touched them, or today when any of them has uncommitted
 *  changes (or git is not available on the build host) */
const COPY = ['src/content/static.ts', 'src/config/seo.ts']
const SOURCES = {
  '/': ['src/content/home.ts', 'src/components/Hero.tsx', 'src/components/SameDay.tsx', 'src/components/Abilities.tsx', 'src/components/HomeWork.tsx', 'src/components/Approach.tsx', 'src/components/Quiz.tsx', 'src/content/quiz.ts', 'src/content/blog.ts', ...COPY],
  '/projects': ['src/content/complex.ts', 'src/pages/ComplexPage.tsx', 'src/components/complex', ...COPY],
  '/contact': ['src/content/contact.ts', 'src/pages/ContactPage.tsx', ...COPY],
  '/simple': ['src/pages/SimplePage.tsx', 'src/components/simple'],
  '/privacy': ['src/pages/PrivacyPage.tsx', ...COPY],
  '/terms': ['src/content/legal.ts', ...COPY],
  '/blog': ['src/content/blog.ts', 'src/pages/BlogPage.tsx', ...COPY],
}
function lastmod(path) {
  const files = SOURCES[path]
  if (!files) return today
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (git('status', '--porcelain', '--', ...files)) return today
    return git('log', '-1', '--format=%cs', '--', ...files) || today
  } catch {
    return today
  }
}

const indexable = ALL_PAGES.filter((p) => !p.noindex)
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  indexable
    .map(
      (p) =>
        `  <url>\n    <loc>${absolute(p.path)}</loc>\n    <lastmod>${p.post ? p.post.updated ?? p.post.date : lastmod(p.path)}</lastmod>\n    <image:image>\n      <image:loc>${absolute(p.image)}</image:loc>\n    </image:image>\n  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

// Search engines and AI assistants (search, answer and training crawlers)
// are all welcome to read and cite the site. They share one group, so the
// /api/ rule applies to every one of them: a crawler obeys only the most
// specific group that names it, never the * group as well.
const AI_CRAWLERS = [
  // OpenAI (ChatGPT search, ChatGPT browsing, training)
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
  // Anthropic
  'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'anthropic-ai',
  // Perplexity
  'PerplexityBot', 'Perplexity-User',
  // Google Gemini and Apple Intelligence training controls
  'Google-Extended', 'Applebot', 'Applebot-Extended',
  // Microsoft Copilot rides on Bingbot (covered by *); others
  'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai', 'meta-externalagent', 'meta-externalfetcher', 'CCBot', 'Bytespider',
]
const robots =
  `# Clause & Code — ${ORIGIN}\n` +
  `# A summary of the site for language models: ${ORIGIN}/llms.txt\n\n` +
  `User-agent: *\nAllow: /\nDisallow: /api/\n\n` +
  `# AI assistants and their crawlers are welcome to read and cite the site\n` +
  AI_CRAWLERS.map((ua) => `User-agent: ${ua}`).join('\n') +
  `\nAllow: /\nDisallow: /api/\n\n` +
  `Sitemap: ${ORIGIN}/sitemap.xml\n`
writeFileSync(join(dist, 'robots.txt'), robots)

writeFileSync(join(dist, 'llms.txt'), llmsTxt())
writeFileSync(join(dist, 'llms-full.txt'), llmsTxt(true))
console.log('prerender sitemap.xml robots.txt llms.txt llms-full.txt')
