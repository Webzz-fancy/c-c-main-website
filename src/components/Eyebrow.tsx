import type { CSSProperties } from 'react'

type EyebrowProps = {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Uppercase section label. Plain type, no dot, no rule and no capsule, so it
 * reads as a quiet kicker above the heading.
 */
export default function Eyebrow({ children, className = '', style }: EyebrowProps) {
  return (
    <p
      className={`flex items-center text-[12px] font-semibold uppercase tracking-[0.14em] text-glass ${className}`}
      style={style}
    >
      {children}
    </p>
  )
}
