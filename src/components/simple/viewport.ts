/**
 * The viewport heights the scroll-driven layout is measured against. Both are
 * read off a hidden fixed probe, so the numbers are exactly what the CSS
 * units give (no two browsers agree on what else to expose them as).
 *
 *   · `100vh`  — the height with the browser's own bars retracted. On a phone
 *     this is the height the page is seen at once the user is scrolling, and
 *     it does NOT change as the bars slide in and out, so it is what the
 *     pinned stage is sized with and what its scroll budget is measured in.
 *     `window.innerHeight` moves with the bars instead: anything laid out
 *     from it would be re-measured — and jump — mid scroll, which reads as
 *     the page sticking.
 *
 *   · `100svh` — the SMALL viewport: the height that is on screen even with
 *     the browser's bars fully showing. The bars cover the bottom of the
 *     page while they are up, so whatever must be read at all times (the
 *     projects window, its status strip, the orange ground under it) is laid
 *     out inside THIS height, anchored to the top of the stage: the window's
 *     bottom edge can then never disappear under a toolbar, on any phone.
 *     On desktop there are no bars and this is simply the window height.
 *
 * On top of both, the device's own bottom inset (the home indicator on a
 * notched phone) is kept clear of the window.
 */
type ProbeKey = 'vh' | 'svh' | 'inset'

const probeCache: Record<ProbeKey, HTMLDivElement | null> = { vh: null, svh: null, inset: null }

function makeProbe(css: string, key: ProbeKey) {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = `position:fixed;top:0;left:0;width:0;${css};visibility:hidden;pointer-events:none;contain:strict;`
  document.body.appendChild(el)
  probeCache[key] = el
  return el.offsetHeight
}

function probe(css: string, key: ProbeKey, fallback: () => number) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0
  const el = probeCache[key]
  const v = !el || !el.isConnected ? makeProbe(css, key) : el.offsetHeight
  return v || fallback()
}

/** 100vh — the stage's own height; steady as the phone's bars move */
export function viewportH(): number {
  return probe('height:100vh', 'vh', () => (typeof window === 'undefined' ? 0 : window.innerHeight))
}

/** 100svh — the height that is visible even with the browser's bars showing */
export function viewportSmallH(): number {
  return probe('height:100svh', 'svh', () => viewportH())
}

/** env(safe-area-inset-bottom) — the device's own bottom inset, px */
export function safeAreaBottom(): number {
  return probe('height:env(safe-area-inset-bottom,0px)', 'inset', () => 0)
}

/**
 * The height everything inside the pinned stage is laid out against: the
 * part of the stage that is on screen whatever the browser's bars and the
 * device's home indicator are doing. Never more than the stage itself.
 */
export function layoutH(): number {
  const vh = viewportH()
  const small = Math.min(vh, viewportSmallH())
  // a floor, so a freak measurement cannot collapse the section
  return Math.max(320, small - safeAreaBottom())
}
