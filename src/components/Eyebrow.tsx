import { useEffect, useRef, useState, type CSSProperties } from 'react'

type EyebrowProps = {
  children: React.ReactNode
  /** Small leading rule + dot, for a touch of structure without a pill. */
  withRule?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Uppercase section label. Plain type (no capsule) so it reads as a quiet
 * kicker above the heading rather than a badge. The little rule wipes out
 * from the dot when the label scrolls into view.
 */
export default function Eyebrow({
  children,
  withRule = true,
  className = '',
  style,
}: EyebrowProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.6 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <p
      ref={ref}
      className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted ${className}`}
      style={style}
    >
      {withRule && (
        <span className="flex items-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          <span
            className="h-px bg-gradient-to-r from-brand/70 to-transparent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: drawn ? '1.75rem' : '0rem' }}
          />
        </span>
      )}
      {children}
    </p>
  )
}
