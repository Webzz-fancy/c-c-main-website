/**
 * IndexNow — tell Bing (and Yandex, Seznam, Naver; Bing shares it with
 * ChatGPT search and Copilot) that pages changed, so they recrawl in minutes
 * instead of waiting for the next visit.
 *
 * The key file public/c64a6f6db05a785b6023e5ec71815647.txt is deployed with the site at
 * https://clauseandcode.com/c64a6f6db05a785b6023e5ec71815647.txt — that file proves we own the host.
 * Keep the key and the file name in step if you ever change it.
 *
 * Run it after a deploy is live (never before: the engines fetch the URLs
 * straight away):
 *
 *   node scripts/indexnow.mjs            # dry run: prints what it would send
 *   node scripts/indexnow.mjs --submit   # sends every URL in dist/sitemap.xml
 *   node scripts/indexnow.mjs --submit https://clauseandcode.com/projects
 *
 * Only submit pages that actually changed; resubmitting unchanged pages again
 * and again can get the key ignored.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY = 'c64a6f6db05a785b6023e5ec71815647'
const HOST = 'clauseandcode.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const submit = args.includes('--submit')
let urls = args.filter((a) => a.startsWith('http'))

if (!existsSync(join(root, 'public', `${KEY}.txt`))) {
  console.error(`public/${KEY}.txt is missing: the engines would reject the key.`)
  process.exit(1)
}
if (urls.length === 0) {
  const sitemap = join(root, 'dist', 'sitemap.xml')
  if (!existsSync(sitemap)) {
    console.error('dist/sitemap.xml not found. Run `npm run build` first, or pass the URLs.')
    process.exit(1)
  }
  urls = [...readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.match(/\.(png|jpe?g|webp)$/))
}
const foreign = urls.filter((u) => new URL(u).host !== HOST)
if (foreign.length) {
  console.error('Only URLs on ' + HOST + ' can be submitted:', foreign.join(', '))
  process.exit(1)
}

const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }
if (!submit) {
  console.log('Dry run. Would POST to', ENDPOINT)
  console.log(JSON.stringify(body, null, 2))
  console.log('Add --submit to send it.')
  process.exit(0)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})
// 200 or 202: accepted. 403: key file not reachable. 422: URL not on host.
console.log('IndexNow responded', res.status, res.statusText)
if (!res.ok && res.status !== 202) process.exit(1)
