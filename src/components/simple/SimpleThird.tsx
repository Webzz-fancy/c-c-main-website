import { useEffect, useState } from 'react'
import {
  CARD_TILT,
  PROJECTS,
  RING_ANGLE,
  RING_SIZE,
  RING_Y,
  lineGeom,
  ringGeom,
  ringScale,
  ropeY,
} from './lineGeom'

/**
 * Section 3 — the orange "work" section. Everything here is driven by the
 * page's shared smoothed scroll (five phase values, all 0→1, linear in
 * scroll; easing happens here):
 *
 *   q1    — the plain brand-orange dome rises from the bottom of the frozen
 *           section above and takes over the whole screen (no text on it)
 *   q2    — the heading + subline letters appear, upper-left, on the orange
 *   qSpin — the presentation: the heading fades out as the ten previews
 *           surface on a ring around a vertical axis (different heights,
 *           facing the viewer); the ring turns exactly ONCE, decelerating
 *           into its rest pose. As it settles, the clothesline fades in
 *           underneath.
 *   qDrop — each preview leaves its ring position and hangs on the line with
 *           its clip, one by one (white placeholder cards, clipped to the line)
 *   qPan  — the whole line moves horizontally (1:1 with scroll) until the
 *           last project has passed, then the footer arrives
 *
 * One DOM element per project carries it through ALL phases (ring → hop →
 * hanging), so the spin → hang handoff is a pure interpolation, never a swap.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const inCubic = (t: number) => t * t * t
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const HEAD_LINES = ['Made to', 'be found.']
const SUB =
  'A line of recent Simple builds. Each one mapped before it was designed, built to load fast, and structured so people and AI can find it and understand it.'

/**
 * The turn itself: one full revolution. The reference ring is front-loaded —
 * it turns fast and coasts to a stop (a power-out with exponent ≈2.4 fits
 * its tracked angle to within a few degrees). Here the same coast is given a
 * soft start as well, so the ring also comes to rest gently when the scroll
 * runs backwards. Monotonic in scroll: scrolling back simply runs the turn
 * in reverse — it can never replay on its own.
 */
const SPIN_EASE = (t: number) => 1 - Math.pow(1 - Math.pow(t, 1.25), 2.6)

/** the previews fade up over this first part of the turn — and the heading
 *  fades out over the same stretch, so the text is gone as the cards arrive */
const RING_IN = 0.14

/** the line fades in as the turn is settling, and is fully there before any
 *  preview lets go of the ring */
const LINE_IN_START = 0.6
const LINE_IN_END = 0.9

/** the hop onto the line: card i lifts off at i × HOP_STEP and takes HOP_DUR
 *  (in qDrop units). Long enough that the previews whose slot is off the
 *  right edge glide out of view instead of streaking. */
const HOP_DUR = 0.42
const HOP_STEP = 0.062

type Props = { q1: number; q2: number; qSpin: number; qDrop: number; qPan: number }

export default function SimpleThird({ q1, q2, qSpin, qDrop, qPan }: Props) {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { w, h } = vp
  const g = lineGeom(w)
  const ring = ringGeom(w, h)
  const rScale = ringScale(w)

  /* ---- 1 · the plain orange dome (no text) ------------------------------ */
  // An arch rising from below the frame: a circular crown (its radius sets
  // how arched the leading edge looks — at 0.78 × viewport width the crown
  // leads the corners by ~30 % of the viewport height on a desktop screen, a
  // real arch rather than a near-flat wave) on top of a full-width body that
  // carries the colour down past the bottom of the frame on any aspect
  // ratio. It rises until the crown clears the top of the frame by the
  // sagitta plus a margin, so the corners are covered too and the whole
  // frame is orange when the heading arrives.
  const domeQ = smooth(clamp01(q1))
  const R = w * 0.78
  const sagitta = R - Math.sqrt(Math.max(0, R * R - (w / 2) * (w / 2)))
  const domeTop = h * 1.02 + (-(sagitta + h * 0.06) - h * 1.02) * domeQ

  /* ---- 2 · heading letters + subline (upper LEFT) ----------------------- */
  // the heading fades away as the previews surface for the turn, so the
  // ring has the screen to itself (reverse scroll brings it back the same way)
  const headExit = smooth(clamp01(qSpin / RING_IN))
  const subQ = smooth(clamp01((q2 - 0.62) / 0.38))
  const offsets = HEAD_LINES.reduce<number[]>((a, line, i) => {
    a.push(i ? a[i - 1] + line.length : 0)
    return a
  }, [])

  /* ---- 3 · the presentation ring: one turn ------------------------------ */
  // 0 → 1 over the spin budget; the ring's remaining angle is (1 - turn) × 360°
  const turn = SPIN_EASE(clamp01(qSpin))
  // the previews surface during the first stretch of the turn — by the time
  // they are fully there the ring has already swung ~40°, so, as in the
  // reference, it is never seen standing still
  const ringIn = smooth(clamp01(qSpin / RING_IN))

  /* ---- 4 · the clothesline ---------------------------------------------- */
  // fades in — already in place, under the whole cloud — while the ring is
  // coasting to a stop, and is fully there before the first preview lets go
  const ropeQ = smooth(clamp01((qSpin - LINE_IN_START) / (LINE_IN_END - LINE_IN_START)))
  const pan = clamp01(qPan)
  const lineX = -pan * g.distance
  const L0 = w / 2 - g.margin - g.cardW / 2 // card 1 hangs dead-centre
  const ropeYpx = ropeY(w, h)

  return (
    // covers the WHOLE stage (not just one viewport height): when section 2's
    // content is taller than the viewport the stage grows with it, and any
    // strip left uncovered here would slide out between the orange and the
    // footer once the pin releases. Every position inside is still measured
    // against the viewport (w, h), so the choreography is unchanged.
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {/* plain brand orange, rising from the bottom: the arched crown … */}
      <div
        className="absolute rounded-[50%] bg-brand"
        style={{ width: R * 2, height: R * 2, left: w / 2 - R, top: domeTop }}
      />
      {/* … and the body under it (starts at the crown's widest point and
          runs past the bottom of the stage on any aspect ratio) */}
      <div className="absolute inset-x-0 bg-brand" style={{ top: domeTop + R, height: h * 3 }} />

      {/* heading — upper-left corner; letters rise in, then the block fades
          (with a slight lift) as the previews arrive for their turn */}
      <div
        className="absolute text-ink"
        style={{
          left: '7%',
          top: '17svh',
          maxWidth: 'min(680px, 78vw)',
          transform: `translateY(${(-headExit * 18).toFixed(1)}px)`,
          opacity: 1 - headExit,
        }}
      >
        <h2 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.02em]">
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
          className="mt-6 max-w-[560px] text-[clamp(0.95rem,1.35vw,1.2rem)] font-light leading-relaxed text-ink/70"
          style={{ opacity: subQ, transform: `translateY(${((1 - subQ) * 26).toFixed(1)}px)` }}
        >
          {SUB}
        </p>
      </div>

      {/* the clothesline — fades in under the settling ring, projects clip on
          one by one, then the line pans. Viewport-anchored. */}
      <div
        className="absolute"
        style={{ left: L0, top: ropeYpx, width: g.lineW, transform: `translateX(${lineX.toFixed(1)}px)`, willChange: 'transform' }}
      >
        <div className="absolute inset-0" style={{ opacity: ropeQ.toFixed(3) }}>
          {/* the rope — the same brown twill as the one the robot hangs from
              on the right; a real clothesline, so it droops in the middle */}
          <svg width={g.lineW} height={g.sag + 24} className="block" style={{ overflow: 'visible' }}>
            <path
              d={`M 12 12 Q ${g.lineW / 2} ${12 + g.sag}, ${g.lineW - 12} 12`}
              fill="none"
              stroke="#B49075"
              strokeWidth="2.5"
              strokeDasharray="3.2 2.8"
            />
            <path
              d={`M 12 12 Q ${g.lineW / 2} ${12 + g.sag}, ${g.lineW - 12} 12`}
              fill="none"
              stroke="#9A7A61"
              strokeWidth="2.5"
              strokeDasharray="3.2 2.8"
              strokeDashoffset="3.2"
            />
            <circle cx="12" cy="12" r="3.5" fill="#9A7A61" />
            <circle cx={g.lineW - 12} cy="12" r="3.5" fill="#9A7A61" />
          </svg>
        </div>
      </div>

      {/* the ten projects — one element each, carried through every phase:
          on the ring → hopping to the line → hanging (and panning with it).
          Stacked by depth so previews at the front of the ring paint on top. */}
      {PROJECTS.map((p, i) => {
        /* ---- ring pose (viewport px) ---- */
        // angle: rest angle minus the remaining part of the one turn; the
        // ring turns clockwise seen from above (front moves right → back
        // moves left), like the reference
        const a = ((RING_ANGLE[i] - (1 - turn) * 360) * Math.PI) / 180
        const depth = ring.f / (ring.f - ring.R * Math.cos(a)) // > 1 in front, < 1 at the back
        const rx = ring.cx + ring.R * Math.sin(a) * depth
        const ry = ring.cy + RING_Y[i] * ring.ampY * depth
        const rw = RING_SIZE[i] * rScale * g.cardW * depth
        const rz = Math.cos(a) // -1 back … +1 front

        /* ---- hanging pose: its slot on the line (line-local px) ---- */
        const x = g.margin + g.cardW / 2 + i * g.spacing
        const t = x / g.lineW
        const ropeAt = 12 + 2 * t * (1 - t) * g.sag
        const rest = CARD_TILT[i]

        /* ---- the hop: ring → clip on the line, one by one ---- */
        const d = clamp01((qDrop - i * HOP_STEP) / HOP_DUR)
        // a slot inside the viewport is approached gently (in-out); a slot
        // further down the line, past the right edge, is reached with a slow
        // start that keeps accelerating — the card is pulled out of frame
        // along the line rather than streaking across it
        const off = clamp01((L0 + x - (w - g.cardW / 2)) / (w * 0.6))
        const e = lerp(inOutCubic(d), inCubic(d), off)
        const hung = outCubic(d)
        // arc up and over, like a card lifted off and pegged on (the ones
        // heading out of frame keep their arc low, they're already leaving)
        const lift = -Math.sin(Math.PI * e) * h * 0.08 * (1 - 0.6 * off)
        // the clip closes once the card is on the line
        const clipQ = clamp01((d - 0.55) / 0.45)

        // continuous pose — ring pose (viewport-fixed) → slot on the line
        // (which pans with the line). The ring pose is measured relative to
        // the same moving frame so the interpolation is a pure lerp: no
        // switch of parent, no re-anchoring, ever.
        const rxL = rx - L0 - lineX
        const cx = lerp(rxL, x, e)
        const cy = lerp(ry, ropeYpx + ropeAt, e) + lift
        const cw = lerp(rw, g.cardW, e)
        // hand-hung tilt: swings in a touch wide, settles to its rest tilt
        const tilt = rest * (3 - 2 * hung) * hung
        // arrival on the ring: rise from a touch below while fading in
        const inY = (1 - ringIn) * h * 0.06
        // depth-based darkening on the far side keeps the turn legible
        // (an overlay's opacity — composited, no per-frame filter repaint)
        const far = clamp01((1 - rz) / 2) // 0 front … 1 back
        const shade = far * 0.16 * (1 - e)
        // paint order: on the ring, nearer previews over farther ones; a
        // hung preview (on the line, in front) over the ring; one in flight
        // over everything
        const z = d >= 1 ? 250 : d > 0 ? 300 : 100 + Math.round((rz + 1) * 50)

        return (
          <div
            key={p.name}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: cw,
              transform: `translate(${(L0 + lineX + cx - cw / 2).toFixed(1)}px, ${(cy + inY).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`,
              transformOrigin: 'top center',
              opacity: ringIn.toFixed(3),
              zIndex: z,
            }}
          >
            {/* the clip, straddling the rope — closes as the card lands */}
            <div
              className="absolute left-1/2 top-[-9px] z-10 h-[18px] w-[10px] rounded-[3px] bg-ink/80"
              style={{
                transform: `translateX(-50%) scaleY(${(0.4 + 0.6 * clipQ).toFixed(3)})`,
                opacity: clamp01((d - 0.45) / 0.15),
              }}
            >
              <div className="absolute left-1/2 top-[5px] h-[8px] w-[2px] -translate-x-1/2 rounded bg-white/25" />
            </div>
            {/* the card — plain white for now; becomes the site's hero screenshot */}
            <div
              className="relative overflow-hidden rounded-[10px] bg-white shadow-[0_18px_40px_-18px_rgba(27,26,23,0.38)]"
              style={{ marginTop: (10 * e).toFixed(2) + 'px' }}
            >
              <div className="aspect-[5/4] w-full bg-white" />
              {/* far-side shade while on the ring */}
              <div className="absolute inset-0 bg-ink" style={{ opacity: shade.toFixed(3) }} />
            </div>
            {/* the label tag — appears once the card is on the line */}
            <div
              className="mt-2 flex items-baseline justify-center gap-2 whitespace-nowrap text-ink/70"
              style={{ opacity: clamp01((d - 0.7) / 0.3) }}
            >
              <span className="text-[11px] font-semibold tracking-[0.18em]">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[12px] font-medium">
                {p.name} <span className="font-light text-ink/45">· {p.tag}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
