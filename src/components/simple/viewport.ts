/**
 * The steady viewport height for the scroll-driven layout: what `100vh`
 * resolves to — on phones the height of the screen with the browser's own
 * bars retracted, which is how the page is seen once the user is scrolling.
 *
 * `window.innerHeight` is NOT steady there: it grows and shrinks as the bars
 * slide away and back with the scroll, and every one of those changes fires
 * a `resize`. Anything laid out from it (the pinned stage, the projects
 * window inside it, the ring, the scroll budget of the pin) would be
 * re-measured and jump mid scroll — which reads as the page sticking. The
 * pinned stage is sized with `100vh`, so its contents are measured against
 * that same, steady height. On desktop there are no dynamic bars: this is
 * simply the window height.
 *
 * Read off a hidden fixed probe, so the number is exactly what the CSS unit
 * gives (no browser agrees on what else to expose it as).
 */
let probe: HTMLDivElement | null = null

export function viewportH(): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0
  if (!probe || !probe.isConnected) {
    probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;visibility:hidden;pointer-events:none;contain:strict;'
    document.body.appendChild(probe)
  }
  return probe.offsetHeight || window.innerHeight
}
