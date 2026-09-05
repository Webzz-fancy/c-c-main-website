import { useEffect, useRef } from 'react'
import { clamp, damp, prefersReducedMotion } from '../hooks/usePointer'

/**
 * Scroll rope: the Clause & Code robot hangs one-handed from a ring at the
 * end of a rope on the far right edge of the viewport, right beside the
 * browser scrollbar. The rope starts very short; as the page is scrolled
 * the rope pays out and the robot rides down alongside the scrollbar thumb.
 *
 * Purely decorative: fixed, pointer-events-none, small on mobile, a touch
 * larger on desktop. Rope length is driven by smoothed scroll progress in
 * a rAF loop (no React re-renders); a slight velocity-based pendulum swing
 * keeps it physical without ever oscillating.
 */

/** Where the rope/ring line sits inside the robot images, % of their width. */
const ROPE_X_PCT = 82.2

export default function ScrollRope() {
  const ropeRef = useRef<HTMLDivElement>(null)
  const botRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rope = ropeRef.current
    const bot = botRef.current
    if (!rope || !bot) return

    const reduced = prefersReducedMotion()

    // Measured lazily so the responsive CSS width (mobile vs desktop) and
    // the header clearance are always respected.
    let botH = bot.offsetHeight || 100
    let minRope = window.innerWidth < 1024 ? 72 : 38
    const measure = () => {
      botH = bot.offsetHeight || botH
      minRope = window.innerWidth < 1024 ? 72 : 38
    }
    const img = bot.querySelector('img')
    img?.addEventListener('load', measure)

    const targetY = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
      const maxY = Math.max(window.innerHeight - botH - 22, minRope)
      return minRope + p * (maxY - minRope)
    }

    // Reduced motion: track scroll directly, no smoothing, no swing.
    if (reduced) {
      const apply = () => {
        measure()
        const y = targetY()
        rope.style.height = `${y + 2}px`
        bot.style.transform = `translate3d(0, ${y}px, 0)`
      }
      apply()
      window.addEventListener('scroll', apply, { passive: true })
      window.addEventListener('resize', apply)
      return () => {
        img?.removeEventListener('load', measure)
        window.removeEventListener('scroll', apply)
        window.removeEventListener('resize', apply)
      }
    }

    let raf = 0
    let last = performance.now()
    let y = targetY()
    let swing = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const prev = y
      y = damp(y, targetY(), 5.5, dt)

      // Pendulum: lean slightly against the direction of travel, settle to 0.
      const vel = dt > 0 ? (y - prev) / dt : 0 // px/s
      swing = damp(swing, clamp(-vel * 0.014, -6.5, 6.5), 4.5, dt)

      rope.style.height = `${(y + 2).toFixed(1)}px`
      bot.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${swing.toFixed(2)}deg)`

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      img?.removeEventListener('load', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-y-0 right-[6px] z-30 block w-[38px] sm:w-[44px] lg:right-[12px] lg:w-[52px]"
      aria-hidden="true"
    >
      {/* Rope, paying out from the top edge of the viewport */}
      <div
        ref={ropeRef}
        className="absolute top-0 w-[2px] -translate-x-1/2 rounded-b-full"
        style={{
          left: `${ROPE_X_PCT}%`,
          height: 38,
          background:
            'repeating-linear-gradient(170deg, #B49075 0px, #B49075 3px, #9A7A61 3px, #9A7A61 6px)',
          boxShadow: '0 1px 2px rgba(27,26,23,0.15)',
        }}
      />

      {/* Robot holding the ring one-handed (pendulum pivot = the grip point) */}
      <div
        ref={botRef}
        className="absolute top-0 w-full will-change-transform"
        style={{ transformOrigin: `${ROPE_X_PCT}% 0%` }}
      >
        <img
          src="/robot-rope-idle.webp"
          alt=""
          width={706}
          height={1379}
          className="block h-auto w-full drop-shadow-[0_8px_12px_rgba(27,26,23,0.16)]"
          draggable={false}
        />
      </div>
    </div>
  )
}
