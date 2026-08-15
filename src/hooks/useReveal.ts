import { useEffect, useRef, useState } from 'react'

/**
 * Reveals an element the first time it scrolls into view.
 * Returns a ref to attach and a boolean that flips once (never back).
 */
export function useReveal<T extends HTMLElement>(options?: {
  /** Shrinks the viewport rect, so the reveal fires a little after entry. */
  rootMargin?: string
  /** Fraction of the element that must be visible. */
  threshold?: number
}) {
  const { rootMargin = '0px 0px -12% 0px', threshold = 0.15 } = options ?? {}
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion: show immediately, skip the transition.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return { ref, revealed }
}
