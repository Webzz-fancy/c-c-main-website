import { useEffect, useState } from 'react'
import { CARD_TILT, LINE_COUNT, PROJECTS, ROPE_Y, lineGeom } from './lineGeom'

/**
 * Section 3 — the orange "work" section. Everything here is driven by the
 * page's shared smoothed scroll (four phase values, all 0→1, linear in
 * scroll; easing happens here):
 *
 *   q1    — the plain brand-orange dome rises from the bottom of the frozen
 *           section above and takes over the whole screen (no text on it)
 *   q2    — the heading + subline letters appear, on the orange
 *   qDrop — the rope spins in, then each project hangs on it one by one
 *           (white placeholder cards, clipped to the line)
 *   qPan  — the whole line moves horizontally (1:1 with scroll) until the
 *           last project has passed, then the footer arrives
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const HEAD_LINES = ['Work that', 'works.']
const SUB =
  'Ten recent builds, one line. Each one made to be found — by people and by AI — and fast enough to feel instant.'

type Props = { q1: number; q2: number; qDrop: number; qPan: number }

export default function SimpleThird({ q1, q2, qDrop, qPan }: Props) {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { w, h } = vp
  const g = lineGeom(w)

  /* ---- 1 · the plain orange dome (no text) ------------------------------ */
  const domeQ = smooth(clamp01(q1))
  const R = w * 2.1
  const domeTop = h * 1.02 + (-w * 0.1 - h * 1.02) * domeQ

  /* ---- 2 · heading letters + subline ------------------------------------ */
  const headExit = smooth(clamp01(qDrop / 0.3))
  const subQ = smooth(clamp01((q2 - 0.62) / 0.38))
  const offsets = HEAD_LINES.reduce<number[]>((a, line, i) => {
    a.push(i ? a[i - 1] + line.length : 0)
    return a
  }, [])

  /* ---- 3 · the clothesline ---------------------------------------------- */
  const ropeQ = outBack(clamp01(qDrop / 0.12)) // the "one spin" whip-in
  const pan = clamp01(qPan)
  const lineX = -pan * g.distance
  const L0 = w / 2 - g.margin - g.cardW / 2 // card 1 hangs dead-centre
  const ropeYpx = ROPE_Y * h
  const dropStep = (0.99 - 0.12) / LINE_COUNT

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[100svh] overflow-hidden" aria-hidden>
      {/* plain brand orange, rising from the bottom */}
      <div
        className="absolute rounded-[50%] bg-brand"
        style={{ width: R * 2, height: R * 2, left: w / 2 - R, top: domeTop }}
      />

      {/* heading — letters slide up as we scroll (after the orange has taken over) */}
      <div
        className="absolute inset-x-0 px-6 text-center text-ink"
        style={{
          top: '31svh',
          transform: `translateY(${(-headExit * h * 0.45).toFixed(1)}px)`,
          opacity: clamp01(1 - headExit * 1.5),
        }}
      >
        <h2 className="font-display text-[clamp(3rem,9vw,8rem)] leading-[0.95] tracking-[-0.02em]">
          {HEAD_LINES.map((line, li) => (
            <div key={li} className="overflow-hidden pb-[0.06em]">
              {line.split('').map((ch, ci) => {
                const i = offsets[li] + ci
                const lp = smooth(clamp01((q2 - i * 0.035) / 0.45))
                return (
                  <span
                    key={ci}
                    className="inline-block will-change-transform"
                    style={{ transform: `translateY(${((1 - lp) * 112).toFixed(2)}%)` }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                )
              })}
            </div>
          ))}
        </h2>
        <p
          className="mx-auto mt-6 max-w-[620px] text-[clamp(0.95rem,1.35vw,1.2rem)] font-light leading-relaxed text-ink/70"
          style={{ opacity: subQ, transform: `translateY(${((1 - subQ) * 26).toFixed(1)}px)` }}
        >
          {SUB}
        </p>
      </div>

      {/* the clothesline — rope spins in, projects clip on one by one, then the line pans */}
      <div
        className="absolute"
        style={{ left: L0, top: ropeYpx, width: g.lineW, transform: `translateX(${lineX.toFixed(1)}px)`, willChange: 'transform' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scaleX(${Math.max(0.0001, ropeQ).toFixed(4)}) rotate(${((1 - ropeQ) * -8).toFixed(2)}deg)`,
            transformOrigin: '0 12px',
          }}
        >
          {/* the rope (a real line has a whisper of sag) */}
          <svg width={g.lineW} height={g.sag + 24} className="block" style={{ overflow: 'visible' }}>
            <path
              d={`M 12 12 Q ${g.lineW / 2} ${12 + g.sag}, ${g.lineW - 12} 12`}
              fill="none"
              stroke="#1B1A17"
              strokeWidth="2.5"
              strokeOpacity="0.85"
            />
            <circle cx="12" cy="12" r="4" fill="#1B1A17" fillOpacity="0.85" />
            <circle cx={g.lineW - 12} cy="12" r="4" fill="#1B1A17" fillOpacity="0.85" />
          </svg>

          {/* the hanging projects */}
          {PROJECTS.map((p, i) => {
            const x = g.margin + g.cardW / 2 + i * g.spacing
            const t = x / g.lineW
            const ropeAt = 12 + 2 * t * (1 - t) * g.sag
            const d = clamp01((qDrop - (0.12 + i * dropStep)) / 0.14)
            const e = outCubic(d)
            const clipQ = clamp01(d / 0.5)
            const dropY = (1 - e) * -h * 0.3
            const rest = CARD_TILT[i]
            const tilt = rest + (rest * 3 - rest) * (1 - e)
            if (d <= 0) return null
            return (
              <div
                key={p.name}
                className="absolute will-change-transform"
                style={{
                  left: x - g.cardW / 2,
                  top: ropeAt,
                  width: g.cardW,
                  transform: `translateY(${dropY.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`,
                  transformOrigin: 'top center',
                  opacity: Math.min(1, d * 2.2),
                }}
              >
                {/* the clip, straddling the rope */}
                <div
                  className="absolute left-1/2 top-[-9px] z-10 h-[18px] w-[10px] rounded-[3px] bg-ink/80"
                  style={{ transform: `translateX(-50%) scaleY(${(0.4 + 0.6 * clipQ).toFixed(3)})` }}
                >
                  <div className="absolute left-1/2 top-[5px] h-[8px] w-[2px] -translate-x-1/2 rounded bg-white/25" />
                </div>
                {/* the card — plain white for now; becomes the site's hero screenshot */}
                <div className="relative mt-[10px] overflow-hidden rounded-[10px] bg-white shadow-[0_18px_40px_-18px_rgba(27,26,23,0.38)]">
                  <div className="aspect-[5/4] w-full bg-white" />
                </div>
                {/* the label tag */}
                <div className="mt-2 flex items-baseline justify-center gap-2 whitespace-nowrap text-ink/70">
                  <span className="text-[11px] font-semibold tracking-[0.18em]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[12px] font-medium">
                    {p.name} <span className="font-light text-ink/45">· {p.tag}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
