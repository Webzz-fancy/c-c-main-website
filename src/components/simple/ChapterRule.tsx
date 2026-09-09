import type { Ref } from 'react'

/**
 * The chapter rule — the one line that runs through the Simple page, in its
 * "rule" form: index · the line · label. Section 2 opens with it on the blue
 * (light), section 3 draws it again in the same place on the orange (ink),
 * and from there the very same line descends to become the clothesline.
 *
 * `drawn` scrubs the line left → right (the index arrives with the pen, the
 * label once the pen is most of the way across). `fade` takes the index and
 * label away again without disturbing the line's geometry, so another
 * element can take the line over at exactly the measured position.
 */
type Props = {
  index: string
  label: string
  /** 0 → 1, the pen travelling left → right */
  drawn: number
  tone: 'light' | 'ink'
  /** the middle line element, for measuring where the line is */
  lineRef?: Ref<HTMLSpanElement>
  /** hide the row's own line (something else is drawing it now) */
  lineHidden?: boolean
  /** 0 → 1 fades the index and label out */
  fade?: number
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export default function ChapterRule({ index, label, drawn, tone, lineRef, lineHidden = false, fade = 0 }: Props) {
  const d = clamp01(drawn)
  const keep = 1 - clamp01(fade)
  const light = tone === 'light'
  return (
    <div
      className={`flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] sm:gap-6 ${light ? 'text-white/60' : 'text-ink/60'}`}
    >
      <span className={`tabular-nums ${light ? 'text-white/85' : 'text-ink/80'}`} style={{ opacity: clamp01(d / 0.25) * keep }}>
        {index}
      </span>
      <span ref={lineRef} className="relative h-px flex-1 overflow-hidden" aria-hidden>
        <span
          className={`absolute inset-0 origin-left ${light ? 'bg-white/35' : 'bg-ink/45'}`}
          style={{ transform: `scaleX(${d.toFixed(4)})`, opacity: lineHidden ? 0 : 1 }}
        />
      </span>
      <span className="whitespace-nowrap" style={{ opacity: clamp01((d - 0.55) / 0.45) * keep }}>
        {label}
      </span>
    </div>
  )
}
