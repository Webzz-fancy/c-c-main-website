import { useEffect, useRef, useState } from 'react'

type UnderlineProps = {
  /** Draw the stroke. Drive this from a reveal/in-view flag. */
  active?: boolean
  /**
   * Scrubbed draw, 0→1. When given, the stroke follows this value directly
   * (no transition), so a scroll-driven timeline can draw and undraw it.
   */
  progress?: number
  /** Delay before the draw starts, in ms. */
  delay?: number
  /** Draw duration, in ms. */
  duration?: number
  /** Stroke opacity. */
  opacity?: number
  /** Stroke colour (any CSS colour). Defaults to the brand yellow. */
  color?: string
  className?: string
}

/**
 * Hand-drawn style underline that draws itself left-to-right.
 *
 * The path length is measured from the live element (and re-measured on
 * resize) so the dash animation stays exact at any rendered width — with
 * preserveAspectRatio="none" the on-screen length changes with the container.
 */
export default function Underline({
  active = false,
  progress,
  delay = 0,
  duration = 1600,
  opacity = 0.6,
  color,
  className = '',
}: UnderlineProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const [length, setLength] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (pathRef.current) setLength(pathRef.current.getTotalLength())
    }
    measure()

    const ro = new ResizeObserver(measure)
    if (pathRef.current?.ownerSVGElement) ro.observe(pathRef.current.ownerSVGElement)
    document.fonts?.ready.then(measure).catch(() => {})

    return () => ro.disconnect()
  }, [])

  const scrub = progress !== undefined
  const drawn = scrub ? Math.max(0, Math.min(1, progress)) : active ? 1 : 0
  const total = length || 1

  return (
    <svg
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute -bottom-1 left-0 h-[10px] w-full text-brand ${className}`}
      style={color ? { color } : undefined}
      fill="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M2 9C60 3 120 2 180 5c40 2 78 5 118 3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity={opacity}
        style={{
          strokeDasharray: total,
          strokeDashoffset: total * (1 - drawn),
          transition: scrub
            ? 'none'
            : `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }}
      />
    </svg>
  )
}
