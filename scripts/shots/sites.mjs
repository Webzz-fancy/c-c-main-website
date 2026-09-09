// Screenshots of the six Simple builds for the Projects ring — run by the
// "Project screenshots" workflow (the sandbox cannot reach the sites).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const SITES = [
  ['smash', 'https://webzz-fancy.github.io/burger-site/'],
  ['the-yard', 'https://webzz-fancy.github.io/yard-new/'],
  ['dana-habayeb', 'https://art-gallery-dana.netlify.app/'],
  ['yaseen-faez', 'https://yaseen-faez.netlify.app/'],
  ['alfajr', 'https://alfajr-watches.netlify.app/'],
  ['rashtions', 'https://rashtions.netlify.app/'],
]

mkdirSync('public/projects', { recursive: true })
const browser = await chromium.launch()
for (const [slug, url] of SITES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 90000 })
    try { await page.waitForLoadState('networkidle', { timeout: 30000 }) } catch {}
    // every one of these sites opens with a loading screen — give it time
    // to count up and clear, and the hero time to settle
    await page.waitForTimeout(12000)
    await page.mouse.move(720, 450)
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(800)
    await page.screenshot({ path: `public/projects/${slug}.jpg`, type: 'jpeg', quality: 86 })
    console.log('ok', slug)
  } catch (e) {
    console.log('FAILED', slug, e.message)
  }
  await page.close()
}
await browser.close()
