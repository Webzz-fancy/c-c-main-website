import { useEffect, useRef } from 'react'

export type PointerRef = {
  /** Latest pointer position in viewport pixels. */
  x: number
  y: number
  /** True once the pointer has moved at least once (avoids a jump from 0,0). */
  active: boolean
}

/**
 * Tracks the pointer in a ref (no re-renders) so animation loops can read it
 * every frame at zero React cost.
 */
export function usePointer(): React.RefObject<PointerRef> {
  const pointer = useRef<PointerRef>({
    x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
    y: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
    active: false,
  })

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX
      pointer.current.y = event.clientY
      pointer.current.active = true
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return pointer
}

/** Frame-rate independent smoothing factor. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
