import { useEffect, useRef } from 'react'
import { damp, usePointer } from '../hooks/usePointer'

/**
 * Soft orange light spot that trails the (standard) cursor — a faded,
 * blurred brand-warm glow that lags a touch behind the pointer and swells
 * gently over interactive elements. The native cursor stays visible.
 */
export default function CursorGlow() {
  const pointer = usePointer()
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isCoarse) return

    let raf = 0
    let last = performance.now()
    let gx = pointer.current.x
    let gy = pointer.current.y
    let scale = 1

    const interactiveSelector = 'a, button, [role="button"], input, textarea, select'

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const { x, y, active } = pointer.current

      gx = damp(gx, x, 16, dt)
      gy = damp(gy, y, 16, dt)

      const hovered = active
        ? (document.elementFromPoint(x, y)?.closest(interactiveSelector) ?? null)
        : null
      scale = damp(scale, hovered ? 1.45 : 1, 10, dt)

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`
        glowRef.current.style.opacity = active ? '1' : '0'
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pointer])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden md:block" aria-hidden="true">
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-44 w-44 rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(225,173,52,0.30) 0%, rgba(225,173,52,0.10) 42%, rgba(225,173,52,0) 70%)',
          filter: 'blur(14px)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}
