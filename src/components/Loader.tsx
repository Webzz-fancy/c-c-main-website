import { useEffect, useRef } from 'react'
import { clamp, damp, prefersReducedMotion } from '../hooks/usePointer'

/**
 * Loading screen: a minimal percentage + progress bar, while the Clause &
 * Code robot rides its broom from the bottom-left corner up and out through
 * the top-right, leaving a short sparkle trail.
 *
 * Progress combines real preloading of the site's key robot assets with a
 * smooth time-based ramp, so the bar always moves and always finishes.
 * Everything runs in one rAF loop with direct DOM writes — no re-renders.
 */

const PRELOAD = [
  '/robot-hero-head.webp',
  '/robot-hero-body.webp',
  '/robot-rope.webp',
  '/robot-broom.webp',
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
}

export default function Loader({ onReveal, onGone, waitFor }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const botRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)

  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal
  const onGoneRef = useRef(onGone)
  onGoneRef.current = onGone
  const waitForRef = useRef(waitFor)
  waitForRef.current = waitFor

  useEffect(() => {
    const root = rootRef.current
    const bot = botRef.current
    const trail = trailRef.current
    if (!root || !bot || !trail) return

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

    let raf = 0
    let display = 0
    let done = false
    let lastSparkle = 0
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
      const extraWaitMs = waitForRef.current ? 9000 : HARD_TIMEOUT_MS
      const externalOk = waitForRef.current ? waitForRef.current() : true
      const assetsDone = (loadedCount >= PRELOAD.length && externalOk) || t > extraWaitMs
      const target = Math.min(timeP, assetsDone ? 1 : 0.85) * 100
      display = damp(display, target, 8, dt)
      if (display > 99.4 && assetsDone) display = 100

      const shown = Math.min(Math.round(display), 100)
      if (pctRef.current) pctRef.current.textContent = `${shown}%`
      if (barRef.current) barRef.current.style.transform = `scaleX(${(display / 100).toFixed(4)})`

      // ---- broom flight: bottom-left -> top-right -------------------------
      const vw = window.innerWidth
      const vh = window.innerHeight
      const p = display / 100
      const x0 = -0.22 * vw
      const y0 = 1.12 * vh
      const dx = 1.44 * vw
      const dy = -1.42 * vh
      const angle = Math.atan2(dy, dx) // radians, negative (up-right)
      const bob = reduced ? 0 : Math.sin(t * 0.004) * 7
      const x = x0 + p * dx
      const y = y0 + p * dy + bob
      const deg = (angle * 180) / Math.PI + 8 // slight nose-up on top of path angle
      bot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${deg.toFixed(1)}deg)`

      // ---- sparkle trail ---------------------------------------------------
      if (!reduced && p > 0.01 && p < 0.99 && now - lastSparkle > 26 && trail.childElementCount < 70) {
        lastSparkle = now
        const w = bot.offsetWidth || 120
        const h = bot.offsetHeight || 132
        // tail of the broom (bristles), rotated with the robot
        const ox = -0.46 * w
        const oy = 0.16 * h
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const tx = x + w / 2 + ox * cos - oy * sin + (Math.random() - 0.5) * 16
        const ty = y + h / 2 + ox * sin + oy * cos + (Math.random() - 0.5) * 16
        const s = document.createElement('span')
        const gold = Math.random() < 0.72
        s.textContent = Math.random() < 0.6 ? '✦' : '✧'
        s.style.cssText =
          `position:absolute;left:${tx.toFixed(0)}px;top:${ty.toFixed(0)}px;` +
          `font-size:${(6 + Math.random() * 9).toFixed(0)}px;line-height:1;` +
          `color:${gold ? '#E1AD34' : '#FFF7E0'};` +
          `text-shadow:0 0 6px rgba(225,173,52,0.55);pointer-events:none;` +
          `animation:cc-sparkle ${(560 + Math.random() * 340).toFixed(0)}ms ease-out forwards;`
        s.addEventListener('animationend', () => s.remove())
        trail.appendChild(s)
      }

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

      {/* Sparkle trail layer */}
      <div ref={trailRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Broom robot */}
      <div
        ref={botRef}
        className="pointer-events-none absolute left-0 top-0 w-[clamp(88px,13vw,150px)] will-change-transform"
        aria-hidden="true"
        style={{ transform: 'translate3d(-30vw, 130vh, 0)' }}
      >
        <img
          src="/robot-broom.webp"
          alt=""
          width={579}
          height={640}
          className="block h-auto w-full drop-shadow-[0_14px_22px_rgba(27,26,23,0.16)]"
          draggable={false}
        />
      </div>

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
