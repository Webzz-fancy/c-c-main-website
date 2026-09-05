import { useEffect, useRef, useState } from 'react'

type UnderlineProps = {
  /** Draw the stroke. Drive this from a reveal/in-view flag. */
  active: boolean
  /** Delay before the draw starts, in ms. */
  delay?: number
  /** Draw duration, in ms. */
  duration?: number
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
  active,
  delay = 0,
  duration = 1600,
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

  return (
    <svg
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute -bottom-1 left-0 h-[10px] w-full text-brand ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d="M2 9C60 3 120 2 180 5c40 2 78 5 118 3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.6"
        style={{
          strokeDasharray: length || 1,
          strokeDashoffset: active ? 0 : length || 1,
          transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }}
      />
    </svg>
  )
}
