// Screenshots of the six Simple builds for the Projects ring — run by the
// "Project screenshots" workflow (the sandbox cannot reach the sites).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

// [slug, url, extra wait ms, scroll to] — The Yard's preview is its first
// section after the film ("Loved by many", the raspberry cup), so the page
// is scrolled to that heading before the shot
const ALL = [
  ['smash', 'https://webzz-fancy.github.io/burger-site/', 0],
  ['the-yard', 'https://webzz-fancy.github.io/yard-new/', 14000, 'loved'],
  ['dana-habayeb', 'https://art-gallery-dana.netlify.app/', 0],
  ['yaseen-faez', 'https://yaseen-faez.netlify.app/', 0],
  ['alfajr', 'https://alfajr-watches.netlify.app/', 0],
  ['rashtions', 'https://rashtions.netlify.app/', 0],
]
const only = (process.env.ONLY || '').split(',').filter(Boolean)
const SITES = only.length ? ALL.filter(([slug]) => only.includes(slug)) : ALL

mkdirSync('public/projects', { recursive: true })
const browser = await chromium.launch()
for (const [slug, url, extra, scrollTo] of SITES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 90000 })
    try { await page.waitForLoadState('networkidle', { timeout: 30000 }) } catch {}
    // every one of these sites opens with a loading screen — give it time
    // to count up and clear, and the hero time to settle
    await page.waitForTimeout(12000 + extra)
    await page.mouse.move(720, 450)
    await page.waitForTimeout(1500)
    if (scrollTo === 'loved') {
      // The Yard opens on a scroll driven film: the "LOVED BY MANY" section
      // is reached by wheeling through it. Wheel in steps until the heading
      // is on screen and settled, then a little further so it sits at the
      // top under the site's header.
      const seen = async () =>
        page.evaluate(() => {
          const heads = [...document.querySelectorAll('h1, h2, h3, div, span')]
          const h = heads.find((el) => el.children.length <= 3 && /loved\s*by\s*many/i.test((el.textContent || '').replace(/\s+/g, ' ')))
          if (!h) return null
          const r = h.getBoundingClientRect()
          const cs = getComputedStyle(h)
          const visible = r.width > 40 && r.height > 20 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5
          return visible ? { top: r.top, bottom: r.bottom } : null
        })
      let found = null
      for (let i = 0; i < 60 && !found; i++) {
        await page.mouse.wheel(0, 320)
        await page.waitForTimeout(450)
        const v = await seen()
        if (v && v.top > 40 && v.top < 260) found = v
      }
      console.log(slug, 'heading', found ? 'found' : 'not found')
      await page.waitForTimeout(3500)
    } else {
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    // the hosting badge is not part of the work: hide any small fixed
    // widget pinned to the bottom right corner (shadow roots included)
    await page.evaluate(() => {
      const hide = (root) => {
        for (const el of root.querySelectorAll('*')) {
          if (el.shadowRoot) hide(el.shadowRoot)
          const cs = getComputedStyle(el)
          if (cs.position !== 'fixed') continue
          const r = el.getBoundingClientRect()
          if (r.width < 420 && r.height < 240 && r.right > innerWidth - 60 && r.bottom > innerHeight - 60) {
            el.style.setProperty('display', 'none', 'important')
          }
        }
      }
      hide(document)
      for (const f of document.querySelectorAll('iframe')) {
        if (/netlify/i.test(f.src || '')) f.style.setProperty('display', 'none', 'important')
      }
    })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `public/projects/${slug}.jpg`, type: 'jpeg', quality: 86 })
    console.log('ok', slug)
  } catch (e) {
    console.log('FAILED', slug, e.message)
  }
  await page.close()
}
await browser.close()
