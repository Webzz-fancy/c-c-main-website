import { useEffect, useRef } from 'react'
import { clamp, damp, prefersReducedMotion } from '../hooks/usePointer'

/**
 * Loading screen: a minimal percentage and progress bar.
 *
 * Progress combines real preloading of the site's key robot assets with a
 * smooth time-based ramp, so the bar always moves and always finishes.
 * Everything runs in one rAF loop with direct DOM writes — no re-renders.
 */

const PRELOAD = [
  '/robot-hero-head.webp',
  '/robot-hero-body.webp',
  '/robot-rope-idle.webp',
  '/logo.png',
]

const RAMP_MS = 1900 // time-based ramp to 100%
const HARD_TIMEOUT_MS = 4500 // never hold the page hostage on a slow asset

type LoaderProps = {
  /** Fired the moment the loader starts fading — mount the site now. */
  onReveal: () => void
  /** Fired once the fade is finished — unmount the loader. */
  onGone: () => void
  /**
   * Optional extra readiness predicate (e.g. "the 3D robot has rendered its
   * first frame"). When provided, the loader holds at ~100% until it returns
   * true — so no incomplete model ever flashes on screen. Pages that don't
   * pass it behave exactly as before.
   */
  waitFor?: () => boolean
  /**
   * Optional heavy asset to load behind the loading screen (the Simple
   * page's 3D robot). Called once on mount with a byte-progress callback;
   * the bar tracks the real download, and the loader holds until the
   * returned promise settles — the asset is fully loaded before the page is
   * revealed.
   */
  preload?: (onProgress: (loaded: number, total: number) => void) => Promise<void>
}

export default function Loader({ onReveal, onGone, waitFor, preload }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal
  const onGoneRef = useRef(onGone)
  onGoneRef.current = onGone
  const waitForRef = useRef(waitFor)
  waitForRef.current = waitFor
  const preloadRef = useRef(preload)
  preloadRef.current = preload

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // No scrolling underneath the loader.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const reduced = prefersReducedMotion()
    const ramp = reduced ? 900 : RAMP_MS

    // ---- real asset preloading ------------------------------------------
    let loadedCount = 0
    for (const src of PRELOAD) {
      const img = new Image()
      img.onload = img.onerror = () => {
        loadedCount += 1
      }
      img.src = src
    }
    // the page's heavy asset (if any): its byte progress feeds the bar
    const heavy = preloadRef.current
    let heavyP = heavy ? 0 : 1
    let heavyDone = !heavy
    heavy?.((loaded, total) => {
      if (total > 0) heavyP = Math.max(heavyP, Math.min(1, loaded / total))
    }).then(
      () => {
        heavyP = 1
        heavyDone = true
      },
      () => {
        heavyDone = true
      },
    )

    let raf = 0
    let display = 0
    let done = false
    const start = performance.now()
    let last = start

    const finish = () => {
      done = true
      cancelAnimationFrame(raf)
      onRevealRef.current()
      root.style.opacity = '0'
      window.setTimeout(() => onGoneRef.current(), 650)
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now - start

      // ---- progress ------------------------------------------------------
      const timeP = clamp(t / ramp, 0, 1)
      // When a waitFor predicate is provided (Simple page: the 3D robot),
      // readiness also requires it — with a generous safety timeout so the
      // loader can never hold the page hostage.
      const extraWaitMs = waitForRef.current || heavy ? 30000 : HARD_TIMEOUT_MS
      const externalOk = waitForRef.current ? waitForRef.current() : true
      const assetsDone = (loadedCount >= PRELOAD.length && heavyDone && externalOk) || t > extraWaitMs
      // with a heavy asset the bar is the real download (blended with the
      // time ramp so it always moves); it can't complete before the asset
      const cap = assetsDone ? 1 : heavy ? Math.min(0.85, 0.12 + 0.73 * heavyP) : 0.85
      const target = Math.min(heavy ? Math.max(timeP, heavyP) : timeP, cap) * 100
      display = damp(display, target, 8, dt)
      if (display > 99.4 && assetsDone) display = 100

      const shown = Math.min(Math.round(display), 100)
      if (pctRef.current) pctRef.current.textContent = `${shown}%`
      if (barRef.current) barRef.current.style.transform = `scaleX(${(display / 100).toFixed(4)})`

      if (display >= 100 && !done) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden bg-cream transition-opacity duration-[600ms] ease-out"
      aria-label="Loading"
      role="status"
    >
      <div className="absolute inset-0 grain opacity-70" aria-hidden="true" />

      {/* Percentage + bar */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-8">
        <span
          ref={pctRef}
          className="font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-none tracking-[-0.02em] text-ink tabular-nums"
        >
          0%
        </span>
        <div className="h-[3px] w-[min(280px,60vw)] overflow-hidden rounded-full bg-black/10">
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full bg-brand"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  )
}
