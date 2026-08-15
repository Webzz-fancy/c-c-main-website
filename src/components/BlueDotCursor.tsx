import { useEffect, useRef } from 'react'
import { damp, usePointer } from '../hooks/usePointer'

/**
 * Blue dot cursor: a crisp dot that sits exactly on the pointer plus a soft
 * trailing halo that lags behind for a premium, fluid feel.
 */
export default function BlueDotCursor() {
  const pointer = usePointer()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isCoarse) return

    let raf = 0
    let last = performance.now()
    let ringX = pointer.current.x
    let ringY = pointer.current.y
    let scale = 1

    const interactiveSelector = 'a, button, [role="button"], input, textarea, select'

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const { x, y, active } = pointer.current

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
        dotRef.current.style.opacity = active ? '1' : '0'
      }

      ringX = damp(ringX, x, 14, dt)
      ringY = damp(ringY, y, 14, dt)

      const hovered = active
        ? (document.elementFromPoint(x, y)?.closest(interactiveSelector) ?? null)
        : null
      scale = damp(scale, hovered ? 2.1 : 1, 12, dt)

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`
        ringRef.current.style.opacity = active ? '1' : '0'
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pointer])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden md:block" aria-hidden="true">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-8 w-8 rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.20) 0%, rgba(37,99,235,0) 70%)',
          border: '1px solid rgba(37,99,235,0.35)',
        }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full opacity-0 transition-opacity duration-300"
        style={{
          backgroundColor: '#2563EB',
          boxShadow: '0 0 0 3px rgba(37,99,235,0.16), 0 4px 12px rgba(37,99,235,0.45)',
        }}
      />
    </div>
  )
}
