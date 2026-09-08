import { useEffect, useState } from 'react'
import {
  CARD_ASPECT,
  LINE_COUNT,
  PROJECTS,
  RING_ANGLE,
  RING_SIZE,
  RING_Y,
  ringCardW,
  ringGeom,
  windowRect,
} from './lineGeom'

/**
 * Section 3 — the work, as a retro desktop (the Neutomni "Pricing.html"
 * section, on our orange). Everything is driven by the page's shared
 * smoothed scroll (four phase values, all 0→1, linear in scroll; easing
 * happens here):
 *
 *   q1    — the entrance. Section 2's copy leaves, the ground changes tone
 *           IN PLACE (the faded blue dissolves into the faded orange); the
 *           desktop is there: a file, "Projects.html", and the window opens
 *           from it — it rises from below the screen, out of focus, and
 *           settles into focus (the site's own reveal: translateY + blur),
 *           its title bar first, its body behind it.
 *   q2    — inside the window: "Projects we make" rises line by line, the
 *           subline with it; the progress dots in the title bar count along.
 *   qSpin — the presentation: the heading blurs away as the ten previews
 *           rise into the window on a ring around a vertical axis (up + out
 *           of a blur, the same move as the window); the ring turns exactly
 *           ONCE, decelerating into its rest pose.
 *   qEnd  — the ring, at rest, steps back into a soft focus and the closing
 *           line, "Made to be found.", comes forward over it — the call into
 *           the Let's talk section below.
 *
 * One DOM element per project. Nothing here plays on a timer.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Section 3 sits on a faded, quieter version of the brand orange #E1AD34 —
 * the same treatment section 2 gives the brand blue (same hue, lifted and
 * desaturated). Ink copy on it keeps a 7.8:1 contrast; the window reads as
 * paper on it rather than glare.
 */
export const THIRD_BG = '#D1AE5D'

/** the window's paper and its chrome */
const PAPER = '#F6F2EA'
const CHROME = '#EDE7DB'
const INK = '#1B1A17'

const HEAD_LINES = ['Projects', 'we make']
const SUB =
  'Ten recent Simple builds. Each one mapped before it was designed, built to load fast, and structured so people and AI can find it and understand it.'
const CLOSE_LINES = ['Made to', 'be found.']

/**
 * The entrance, inside q1:
 *   · the section-2 copy leaves first (SimplePage hands its exit to
 *     SimpleSecond over the first LEAVE part of q1)
 *   · the light comes up: the blue lifts to the page's own cream (a straight
 *     blue → orange dissolve would pass through a muddy khaki; lifting
 *     through the cream keeps every intermediate tone clean and on brand)
 *   · the faded orange settles onto the cream — the desktop
 *   · the file appears on the desktop, and the window opens from it: the
 *     title bar rises first, the body follows a beat behind (the staggered
 *     translateY + blur reveal the reference section uses)
 */
const LEAVE = 0.34
const LIFT_START = 0.2
const LIFT_END = 0.52
const TONE_START = 0.44
const TONE_END = 0.82
const FILE_START = 0.5
const FILE_END = 0.7
const WIN_START = 0.58
const WIN_END = 1.0

/** the section-2 exit share of q1, read by SimplePage */
export const LEAVE_SHARE = LEAVE

/**
 * The robot stands on the ground while it changes tone under it — it is the
 * one thing that stays through the transition — and steps away (a slight
 * lift while fading, the same move the type makes) as the file lands on the
 * desktop, just before its window rises over the place it stood. In q1
 * units; read by SimplePage.
 */
export const ROBOT_EXIT_START = 0.46
export const ROBOT_EXIT_END = 0.66

/**
 * The turn itself: one full revolution. The reference ring is front-loaded —
 * it turns fast and coasts to a stop (a power-out with exponent ≈2.4 fits
 * its tracked angle to within a few degrees). Here the same coast is given a
 * soft start as well, so the ring also comes to rest gently when the scroll
 * runs backwards. Monotonic in scroll: scrolling back simply runs the turn
 * in reverse — it can never replay on its own.
 */
const SPIN_EASE = (t: number) => 1 - Math.pow(1 - Math.pow(t, 1.25), 2.6)

/** the heading blurs out over this first part of the turn, and the previews
 *  rise in just behind it (RING_IN_START → RING_IN_END), so the text is
 *  mostly gone as the cards arrive and fully gone before they settle */
const HEAD_OUT = 0.1
const RING_IN_START = 0.04
const RING_IN_END = 0.2

/** how far (px) the window and the previews rise from, and how far out of
 *  focus they start — the reference's initial states are translateY(100%)
 *  and blur(15px) */
const RISE_BLUR = 15

type Props = { q1: number; q2: number; qSpin: number; qEnd: number }

/** an n-gon path (the reference's progress dots are polygons) */
function polygonPoints(n: number, r: number, cx: number, cy: number) {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export default function SimpleThird({ q1, q2, qSpin, qEnd }: Props) {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { w, h } = vp
  const win = windowRect(w, h)
  const ring = ringGeom(w, h)
  const cardW = ringCardW(w)
  const desk = win.desk

  /* ---- 1 · the entrance: the light comes up, the desktop, the window opens ---- */
  const lift = smooth(clamp01((q1 - LIFT_START) / (LIFT_END - LIFT_START)))
  const tone = smooth(clamp01((q1 - TONE_START) / (TONE_END - TONE_START)))
  const file = outCubic(clamp01((q1 - FILE_START) / (FILE_END - FILE_START)))
  // the window: title bar first, body a beat behind — both rise from below
  // and come into focus (translateY + blur, like the reference's reveal)
  const winQ = clamp01((q1 - WIN_START) / (WIN_END - WIN_START))
  const barIn = outQuart(clamp01(winQ / 0.7))
  const bodyIn = outQuart(clamp01((winQ - 0.18) / 0.82))
  const winVisible = winQ > 0.001
  // the file icon reads as "open" once its window is up
  const fileOpen = smooth(clamp01((winQ - 0.3) / 0.5))

  /* ---- 2 · the heading inside the window ------------------------------- */
  const subQ = smooth(clamp01((q2 - 0.5) / 0.5))
  const offsets = HEAD_LINES.reduce<number[]>((a, line, i) => {
    a.push(i ? a[i - 1] + line.length : 0)
    return a
  }, [])
  // the heading blurs away as the previews rise for their turn (reverse
  // scroll brings it back the same way)
  const headExit = smooth(clamp01(qSpin / HEAD_OUT))
  const headAlpha = 1 - headExit
  const headVisible = q2 > 0.001 && headAlpha > 0.005

  /* ---- 3 · the presentation ring: one turn ----------------------------- */
  const turn = SPIN_EASE(clamp01(qSpin))
  // the previews rise into the window over the first stretch of the turn —
  // by the time they are fully there the ring has already swung ~40°, so,
  // as in the reference, it is never seen standing still
  const ringIn = outCubic(clamp01((qSpin - RING_IN_START) / (RING_IN_END - RING_IN_START)))

  /* ---- 4 · the closing line over the ring at rest ---------------------- */
  const endQ = clamp01(qEnd)
  // the ring steps back (a soft focus + a little smaller + quieter) …
  const ringBack = smooth(clamp01(endQ / 0.6))
  // … and the closing line comes forward, line by line, out of a blur
  const closeVisible = endQ > 0.001

  // the title bar's progress dots: the file's four "pages" — the ring's
  // turn is the third, the closing line the fourth
  const dots = [
    smooth(clamp01(winQ / 0.5)),
    smooth(clamp01(q2 / 0.5)),
    smooth(clamp01(qSpin / 0.5)),
    smooth(clamp01(endQ / 0.5)),
  ]
  const stepLabel = endQ > 0.02 ? '04 / 04' : qSpin > 0.02 ? '03 / 04' : q2 > 0.02 ? '02 / 04' : '01 / 04'

  const fileLeft = desk ? 40 : 14
  const fileTop = desk ? Math.max(120, h * 0.19) : 82

  return (
    // Both layers cover the WHOLE stage (not just one viewport height): when
    // section 2's content is taller than the viewport the stage grows with
    // it, and any strip left uncovered would slide out between the orange
    // and the footer once the pin releases. Every position inside is still
    // measured against the viewport (w, h), so the choreography is unchanged.
    <>
      {/* ---- the ground — UNDER the robot (it stands on it while the tone
          changes), over section 2's plane ---- */}
      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
        {/* the light comes up first: the blue plane lifts to the cream … */}
        <div className="absolute inset-0 bg-cream" style={{ opacity: lift.toFixed(4) }} />
        {/* … and the faded orange settles on it, edge to edge — plain
            opacities, in place: nothing slides, nothing rises */}
        <div className="absolute inset-0" style={{ backgroundColor: THIRD_BG, opacity: tone.toFixed(4) }} />
        {/* the desktop's texture: the home page's grain, and a little light
            from the upper left */}
        <div className="absolute inset-x-0 top-0" style={{ height: h * 1.4, opacity: tone.toFixed(3) }}>
          <div className="absolute inset-0 grain opacity-60" />
          <div
            className="absolute -left-40 -top-24 h-[680px] w-[820px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 68%)' }}
          />
          <div
            className="absolute -bottom-24 -right-32 h-[620px] w-[760px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.12) 0%, rgba(45,109,139,0) 68%)' }}
          />
        </div>
      </div>

      {/* ---- everything that plays on the desktop — over the robot ---- */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" data-third-overlay aria-hidden>
        {/* the file on the desktop: Projects.html. It appears with the
            desktop and opens its window; while the window is up it reads as
            the open document (selected) */}
        <div
          className={`absolute flex items-center text-ink ${desk ? 'w-[92px] flex-col gap-2' : 'flex-row gap-2'}`}
          style={{
            left: fileLeft,
            top: fileTop,
            opacity: file.toFixed(3),
            transform: `translateY(${((1 - file) * 14).toFixed(1)}px)`,
            filter: `blur(${((1 - file) * 6).toFixed(2)}px)`,
          }}
        >
          <svg width={desk ? 44 : 26} height={desk ? 54 : 32} viewBox="0 0 44 54" fill="none" className="drop-shadow-[0_6px_10px_rgba(90,60,10,0.18)]">
            <path d="M3 1.5h25l13 13V52.5H3z" fill={PAPER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M28 1.5v13h13" fill={CHROME} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 25h18M10 31h24M10 37h20M10 43h14" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.55} />
            {/* the open state: a brand square over the sheet */}
            <rect x="24" y="34" width="14" height="14" rx="1" fill="#E1AD34" stroke={INK} strokeWidth="1.5" style={{ opacity: fileOpen }} />
          </svg>
          <span
            className="rounded-[3px] px-1.5 py-[2px] text-center font-mono text-[11px] leading-none tracking-[0.02em]"
            style={{ backgroundColor: `rgba(27,26,23,${(0.82 * fileOpen).toFixed(3)})`, color: fileOpen > 0.5 ? PAPER : INK }}
          >
            Projects.html
          </span>
        </div>

        {/* ---- the window ---- */}
        {winVisible && (
          <div
            className="absolute"
            style={{
              left: win.left,
              top: win.top,
              width: win.width,
              height: win.height,
              transformOrigin: 'bottom center',
            }}
          >
            {/* the body — rises a beat behind the bar, out of a blur */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[4px] border border-ink/85 shadow-[0_30px_80px_-30px_rgba(60,40,5,0.55)] will-change-transform"
              style={{
                backgroundColor: PAPER,
                transform: `translate3d(0, ${((1 - bodyIn) * (h - win.top + 40)).toFixed(1)}px, 0)`,
                filter: bodyIn < 0.999 ? `blur(${((1 - bodyIn) * RISE_BLUR).toFixed(2)}px)` : 'none',
                opacity: clamp01(bodyIn * 4).toFixed(3),
              }}
            >
              {/* the paper's grid — the desktop's grain, finer, on the sheet */}
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage: 'radial-gradient(rgba(27,26,23,0.07) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                  backgroundPosition: '9px 9px',
                }}
              />

              {/* the heading — inside the window, under the bar: rises line
                  by line out of its clips, and blurs away as the previews
                  arrive for their turn */}
              <div
                className="absolute text-ink"
                style={{
                  left: win.pad,
                  top: win.bar + (desk ? win.pad * 0.9 : 24),
                  right: win.pad,
                  opacity: headAlpha,
                  filter: headExit > 0.001 ? `blur(${(headExit * RISE_BLUR).toFixed(2)}px)` : 'none',
                  transform: `translateY(${(-headExit * 24).toFixed(1)}px)`,
                  visibility: headVisible ? 'visible' : 'hidden',
                }}
              >
                <div className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60 sm:mb-7">
                  <span style={{ opacity: clamp01(q2 / 0.3) }}>Our work</span>
                  <span className="h-px w-10 bg-ink/30" style={{ transform: `scaleX(${clamp01(q2 / 0.4).toFixed(3)})`, transformOrigin: 'left' }} />
                  <span style={{ opacity: clamp01((q2 - 0.2) / 0.3) }}>{String(LINE_COUNT).padStart(2, '0')} builds</span>
                </div>
                <h2 className="font-display text-[clamp(2.6rem,7vw,6.6rem)] leading-[0.94] tracking-[-0.025em]">
                  {HEAD_LINES.map((line, li) => {
                    const last = li === HEAD_LINES.length - 1
                    const letters = line.split('').map((ch, ci) => {
                      const i = offsets[li] + ci
                      const lp = smooth(clamp01((q2 - i * 0.03) / 0.42))
                      return (
                        <span
                          key={ci}
                          className="inline-block will-change-transform"
                          style={{ transform: `translateY(${((1 - lp) * 112).toFixed(2)}%)` }}
                        >
                          {ch === ' ' ? '\u00A0' : ch}
                        </span>
                      )
                    })
                    return (
                      <div key={li} className="overflow-hidden pb-[0.06em]">
                        {last ? <span className="italic text-brand-600">{letters}</span> : letters}
                      </div>
                    )
                  })}
                </h2>
                <p
                  className="mt-5 max-w-[520px] text-[clamp(0.95rem,1.25vw,1.12rem)] font-light leading-relaxed text-ink/72"
                  style={{ opacity: subQ, transform: `translateY(${((1 - subQ) * 22).toFixed(1)}px)` }}
                >
                  {SUB}
                </p>
              </div>

              {/* the ten projects on the ring — one element each. Stacked by
                  depth so previews at the front of the ring paint on top. The
                  ring lives in window space: viewport px minus the window's
                  origin. */}
              {PROJECTS.map((p, i) => {
                // angle: rest angle minus the remaining part of the one turn;
                // the ring turns clockwise seen from above (front moves right,
                // back moves left), like the reference
                const a = ((RING_ANGLE[i] - (1 - turn) * 360) * Math.PI) / 180
                const depth = ring.f / (ring.f - ring.R * Math.cos(a)) // > 1 in front, < 1 at the back
                const rx = ring.cx + ring.R * Math.sin(a) * depth - win.left
                const ry = ring.cy + RING_Y[i] * ring.ampY * depth - win.top
                const rw = RING_SIZE[i] * cardW * depth
                const rz = Math.cos(a) // -1 back … +1 front
                // arrival: each preview rises from below the window, out of
                // a blur, in ring order — the nearest first
                const order = ((RING_ANGLE[i] + 180) % 360) / 360
                const inQ = outCubic(clamp01((ringIn - order * 0.35) / 0.65))
                const inY = (1 - inQ) * (win.height - ry + rw * CARD_ASPECT)
                // the step back at the end: smaller, quieter, out of focus
                const back = ringBack
                const cw = rw * lerp(1, 0.9, back)
                const cx = lerp(rx, ring.cx - win.left + (rx - (ring.cx - win.left)) * 0.9, back)
                const cy = lerp(ry, ring.cy - win.top + (ry - (ring.cy - win.top)) * 0.9, back)
                // depth-based darkening on the far side keeps the turn legible
                const far = clamp01((1 - rz) / 2) // 0 front … 1 back
                const shade = far * 0.14
                const z = 100 + Math.round((rz + 1) * 50)
                const blur = (1 - inQ) * RISE_BLUR + back * 4
                return (
                  <div
                    key={p.name}
                    className="absolute left-0 top-0 will-change-transform"
                    style={{
                      width: cw,
                      transform: `translate3d(${(cx - cw / 2).toFixed(1)}px, ${(cy - (cw * CARD_ASPECT) / 2 + inY).toFixed(1)}px, 0)`,
                      opacity: (inQ * (1 - 0.55 * back)).toFixed(3),
                      filter: blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none',
                      zIndex: z,
                      visibility: inQ > 0.001 ? 'visible' : 'hidden',
                    }}
                  >
                    {/* the preview: a small browser sheet — its strip with the
                        name and the tag, and the page below; becomes the site's
                        hero screenshot once the links are in */}
                    <div
                      className="relative overflow-hidden rounded-[6px] border border-ink/80 bg-white shadow-[0_16px_36px_-16px_rgba(60,40,5,0.45)]"
                    >
                      <div className="flex items-center justify-between border-b border-ink/60 px-[7%] py-[4%]" style={{ backgroundColor: CHROME }}>
                        <span className="font-mono text-[clamp(8px,0.62vw,11px)] tracking-[0.04em] text-ink/85">
                          {String(i + 1).padStart(2, '0')}&nbsp;{p.name}
                        </span>
                        <span className="font-mono text-[clamp(7px,0.55vw,10px)] uppercase tracking-[0.12em] text-ink/55">{p.tag}</span>
                      </div>
                      <div className="relative aspect-[3/2] w-full" style={{ backgroundColor: p.tint }}>
                        {/* an abstract page: a heading block, a line of copy,
                            a picture, in the project's own tone */}
                        <div className="absolute left-[7%] top-[12%] h-[11%] w-[46%] rounded-[2px]" style={{ backgroundColor: p.ink, opacity: 0.85 }} />
                        <div className="absolute left-[7%] top-[29%] h-[5%] w-[34%] rounded-[2px]" style={{ backgroundColor: p.ink, opacity: 0.35 }} />
                        <div className="absolute left-[7%] top-[38%] h-[5%] w-[40%] rounded-[2px]" style={{ backgroundColor: p.ink, opacity: 0.35 }} />
                        <div className="absolute bottom-[12%] right-[7%] top-[12%] w-[36%] rounded-[3px] bg-white/70" />
                        <div className="absolute bottom-[12%] left-[7%] h-[13%] w-[20%] rounded-[2px]" style={{ backgroundColor: p.ink }} />
                      </div>
                      {/* far-side shade while on the ring */}
                      <div className="absolute inset-0 bg-ink" style={{ opacity: shade.toFixed(3) }} />
                    </div>
                  </div>
                )
              })}

              {/* the closing line — comes forward over the ring at rest, out
                  of the same blur the previews arrived through */}
              {closeVisible && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 400 }}>
                  {/* a soft wash of the paper behind the type, so it reads
                      over the previews at rest */}
                  <div
                    className="absolute left-1/2 top-1/2 h-[80%] w-[90%] -translate-x-1/2 -translate-y-1/2"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(246,242,234,0.92) 0%, rgba(246,242,234,0.6) 40%, rgba(246,242,234,0) 70%)',
                      opacity: smooth(clamp01((endQ - 0.1) / 0.5)).toFixed(3),
                    }}
                  />
                  <div className="relative px-6 text-center text-ink">
                    <h3 className="font-display text-[clamp(3rem,9vw,8.6rem)] leading-[0.92] tracking-[-0.03em]">
                      {CLOSE_LINES.map((line, li) => {
                        const lp = outExpo(clamp01((endQ - 0.16 - li * 0.18) / 0.5))
                        const last = li === CLOSE_LINES.length - 1
                        return (
                          <div
                            key={li}
                            className="will-change-transform"
                            style={{
                              opacity: lp.toFixed(3),
                              transform: `translate3d(0, ${((1 - lp) * 60).toFixed(1)}px, 0)`,
                              filter: lp < 0.999 ? `blur(${((1 - lp) * RISE_BLUR).toFixed(2)}px)` : 'none',
                            }}
                          >
                            {last ? <span className="italic text-brand-600">{line}</span> : line}
                          </div>
                        )
                      })}
                    </h3>
                    {(() => {
                      const lp = outExpo(clamp01((endQ - 0.62) / 0.38))
                      return (
                        <p
                          className="mx-auto mt-6 max-w-[460px] text-[clamp(0.95rem,1.25vw,1.12rem)] font-light leading-relaxed text-ink/72"
                          style={{ opacity: lp.toFixed(3), transform: `translateY(${((1 - lp) * 20).toFixed(1)}px)` }}
                        >
                          Built to be found by the people searching, and by the AI answering them. Yours could be the next one.
                        </p>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* the status bar */}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-ink/70 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60"
                style={{ height: win.status, backgroundColor: CHROME }}
              >
                <span>Clause &amp; Code · Simple</span>
                <span className="hidden sm:inline">Scroll to turn the ring</span>
                <span className="tabular-nums">{stepLabel}</span>
              </div>
            </div>

            {/* the title bar — rises first, so the window opens bar first */}
            <div
              className="absolute inset-x-0 top-0 flex items-center justify-between rounded-t-[4px] border border-ink/85 px-3 font-mono text-[11px] tracking-[0.04em] text-ink will-change-transform sm:px-4"
              style={{
                height: win.bar,
                backgroundColor: CHROME,
                transform: `translate3d(0, ${((1 - barIn) * (h - win.top + 40)).toFixed(1)}px, 0)`,
                filter: barIn < 0.999 ? `blur(${((1 - barIn) * RISE_BLUR).toFixed(2)}px)` : 'none',
                opacity: clamp01(barIn * 4).toFixed(3),
              }}
            >
              {/* the progress dots — four polygons: the file's four pages */}
              <div className="flex items-center gap-2">
                {dots.map((d, i) => {
                  const sides = 4 + i * 2 // square, hexagon, octagon, decagon
                  return (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                      <polygon points={polygonPoints(sides, 5.5, 7, 7)} fill={INK} stroke={INK} strokeWidth="1" fillOpacity={d} />
                    </svg>
                  )
                })}
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 truncate text-[12px] font-medium">Projects.html</span>
              <div className="flex items-center gap-2">
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-ink/60 sm:inline">Our work</span>
                <span className="grid h-[16px] w-[16px] place-items-center border border-ink/80">
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden><path d="M1 6.5h6" stroke={INK} strokeWidth="1.2" /></svg>
                </span>
                <span className="grid h-[16px] w-[16px] place-items-center border border-ink/80">
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke={INK} strokeWidth="1.2" /></svg>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
