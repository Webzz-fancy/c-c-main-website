import { useLayoutEffect, useState } from 'react'
import { projectShot, projectShotSmall } from './ProjectSheet'
import { viewportH } from './viewport'
import {
  CARD_ASPECT,
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
 *   q1    — the entrance, kept simple: the section arrives as the orange
 *           desktop (it scrolls in under section 2 like any section) and,
 *           while it is still coming up the screen, the projects window
 *           rises inside it from below, out of focus, and settles into
 *           focus as the desktop pins (the reference's own reveal:
 *           translateY + blur), its title bar first, its body a beat
 *           behind — the project simply coming up with the ground.
 *   q2    — inside the window: "Projects we make" rises line by line, the
 *           subline with it; the progress dots in the title bar count along.
 *   qSpin — the presentation: the heading blurs away as the six previews
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

const HEAD_LINES = ['Interactive', 'experiences.']
const SUB =
  'Six recent builds. Each one designed around what its visitors came to do, animated with purpose, quick to load, and structured so people and AI can find it. Click one to look closer.'
/** the heading's letters rise one after the other; the stagger is set from
 *  the letter count so the last letter is always standing by the end of q2 */
const HEAD_LETTERS = HEAD_LINES.join('').length
const HEAD_STAGGER = Math.min(0.03, 0.5 / HEAD_LETTERS)
const CLOSE_LINES = ['Made to', 'be found.']

/**
 * The entrance, inside q1: the window opens — the title bar rises first,
 * the body follows a beat behind (the staggered translateY + blur reveal
 * the reference section uses). It starts as soon as the section is pinned.
 */
const WIN_START = 0.0
const WIN_END = 1.0

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

type Props = { q1: number; q2: number; qSpin: number; qEnd: number; onOpen?: (index: number) => void }

/** an n-gon path (the reference's progress dots are polygons) */
function polygonPoints(n: number, r: number, cx: number, cy: number) {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export default function SimpleThird({ q1, q2, qSpin, qEnd, onOpen }: Props) {
  // the stage is one viewport tall (100vh), so everything in it is measured
  // against that same, steady height — on a phone innerHeight changes with
  // the address bar mid scroll, and re-laying the ring out to it would make
  // the window jump while the ring is turning
  const [vp, setVp] = useState(() => (typeof window === 'undefined' ? { w: 1440, h: 900 } : { w: window.innerWidth, h: window.innerHeight }))
  useLayoutEffect(() => {
    const onResize = () => {
      const next = { w: window.innerWidth, h: viewportH() }
      setVp((cur) => (cur.w === next.w && cur.h === next.h ? cur : next))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { w, h } = vp
  const win = windowRect(w, h)
  const ring = ringGeom(w, h)
  const cardW = ringCardW(w)
  const desk = win.desk
  // the "out of focus" part of the reveals is a real blur filter on
  // desktop; on phones the same moves play without it (a blur re-rasterises
  // the element on every frame of the scroll — six previews, the heading
  // and the window body at once is what made the section stick), and the
  // screenshots are served at the size the ring shows them
  const soft = desk
  const shotSrc = desk ? projectShot : projectShotSmall

  /* ---- 1 · the entrance: the window rises ------------------------------ */
  // the window: title bar first, body a beat behind — both rise from below
  // and come into focus (translateY + blur, like the reference's reveal)
  const winQ = clamp01((q1 - WIN_START) / (WIN_END - WIN_START))
  const barIn = outQuart(clamp01(winQ / 0.7))
  const bodyIn = outQuart(clamp01((winQ - 0.18) / 0.82))
  const winVisible = winQ > 0.001

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

  // the title bar's progress dots: the window's four "pages" — the ring's
  // turn is the third, the closing line the fourth
  const dots = [
    smooth(clamp01(winQ / 0.5)),
    smooth(clamp01(q2 / 0.5)),
    smooth(clamp01(qSpin / 0.5)),
    smooth(clamp01(endQ / 0.5)),
  ]
  const stepLabel = endQ > 0.02 ? '04 / 04' : qSpin > 0.02 ? '03 / 04' : q2 > 0.02 ? '02 / 04' : '01 / 04'

  return (
    // All layers cover the whole stage (one viewport, pinned); every
    // position inside is measured against the viewport (w, h).
    <>
      {/* ---- the ground: the orange desktop ---- */}
      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" style={{ backgroundColor: THIRD_BG }} aria-hidden>
        {/* the desktop's texture: the home page's grain, and a little light
            from the upper left */}
        <div className="absolute inset-x-0 top-0" style={{ height: h * 1.4 }}>
          <div className="absolute inset-0 grain opacity-60" />
          {/* (the glows are soft radial gradients already; the extra blur
              is only worth its cost on desktop) */}
          <div
            className={`absolute -left-40 -top-24 h-[680px] w-[820px] rounded-full ${soft ? 'blur-3xl' : ''}`}
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 68%)' }}
          />
          <div
            className={`absolute -bottom-24 -right-32 h-[620px] w-[760px] rounded-full ${soft ? 'blur-3xl' : ''}`}
            style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.12) 0%, rgba(45,109,139,0) 68%)' }}
          />
        </div>
      </div>

      {/* ---- everything that plays on the desktop ---- */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" data-third-overlay>
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
                filter: soft && bodyIn < 0.999 ? `blur(${((1 - bodyIn) * RISE_BLUR).toFixed(2)}px)` : 'none',
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
                  filter: soft && headExit > 0.001 ? `blur(${(headExit * RISE_BLUR).toFixed(2)}px)` : 'none',
                  transform: `translateY(${(-headExit * 24).toFixed(1)}px)`,
                  visibility: headVisible ? 'visible' : 'hidden',
                }}
              >
                <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60 sm:mb-7" style={{ opacity: clamp01(q2 / 0.3) }}>
                  Our work
                </div>
                <h2 className="font-display text-[clamp(2.6rem,7vw,6.6rem)] leading-[0.94] tracking-[-0.025em]">
                  {HEAD_LINES.map((line, li) => {
                    const last = li === HEAD_LINES.length - 1
                    const letters = line.split('').map((ch, ci) => {
                      const i = offsets[li] + ci
                      const lp = smooth(clamp01((q2 - i * HEAD_STAGGER) / 0.42))
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

              {/* the six projects on the ring — one element each. Stacked by
                  depth so previews at the front of the ring paint on top. The
                  ring lives in window space: viewport px minus the window's
                  origin. Each is a button: it opens the build's sheet. */}
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
                // clickable once it has arrived and is not too far round the
                // back (the front ones are what the eye is on)
                const clickable = inQ > 0.95 && rz > -0.6 && !!onOpen
                return (
                  <button
                    key={p.slug}
                    type="button"
                    tabIndex={clickable ? 0 : -1}
                    aria-label={`${p.name}: look closer`}
                    onClick={clickable ? () => onOpen(i) : undefined}
                    className={`group absolute left-0 top-0 block appearance-none border-0 bg-transparent p-0 text-left will-change-transform ${clickable ? 'pointer-events-auto cursor-pointer' : ''}`}
                    style={{
                      width: cw,
                      transform: `translate3d(${(cx - cw / 2).toFixed(1)}px, ${(cy - (cw * CARD_ASPECT) / 2 + inY).toFixed(1)}px, 0)`,
                      opacity: (inQ * (1 - 0.55 * back)).toFixed(3),
                      filter: soft && blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none',
                      zIndex: z,
                      visibility: inQ > 0.001 ? 'visible' : 'hidden',
                    }}
                  >
                    {/* the preview: a small browser sheet — its strip with the
                        name and the tag, and the site's home page below */}
                    <div className="relative overflow-hidden rounded-[6px] border border-ink/80 bg-white shadow-[0_16px_36px_-16px_rgba(60,40,5,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                      <div className="flex items-center justify-between gap-2 border-b border-ink/60 px-[6%] py-[3.5%]" style={{ backgroundColor: CHROME }}>
                        <span className="truncate whitespace-nowrap font-mono text-[clamp(8px,0.62vw,11px)] tracking-[0.04em] text-ink/85">
                          {String(i + 1).padStart(2, '0')}&nbsp;{p.name}
                        </span>
                        {desk && <span className="shrink-0 whitespace-nowrap font-mono text-[clamp(7px,0.55vw,10px)] uppercase tracking-[0.12em] text-ink/55">{p.tag}</span>}
                      </div>
                      <div className="relative aspect-[16/10] w-full" style={{ backgroundColor: p.tint }}>
                        <img
                          src={shotSrc(p.slug)}
                          alt={`${p.name}, ${p.tag.toLowerCase()} website by Clause & Code`}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                        {/* the invitation, on hover */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-end p-[5%] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <span className="rounded-full border border-white/80 bg-ink/80 px-[3.5%] py-[1.5%] font-mono text-[clamp(7px,0.55vw,10px)] uppercase tracking-[0.14em] text-white">
                            Look closer
                          </span>
                        </div>
                      </div>
                      {/* far-side shade while on the ring */}
                      <div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: shade.toFixed(3) }} />
                    </div>
                  </button>
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
                              filter: soft && lp < 0.999 ? `blur(${((1 - lp) * RISE_BLUR).toFixed(2)}px)` : 'none',
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

              {/* the status bar — in front of the ring: the previews rise
                  into the window from under it, never over it */}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-ink/70 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60"
                style={{ height: win.status, backgroundColor: CHROME, zIndex: 300 }}
              >
                <span>Clause &amp; Code · Websites</span>
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
                filter: soft && barIn < 0.999 ? `blur(${((1 - barIn) * RISE_BLUR).toFixed(2)}px)` : 'none',
                opacity: clamp01(barIn * 4).toFixed(3),
              }}
            >
              {/* the progress dots — four polygons: the window's four pages */}
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
              <span className="absolute left-1/2 -translate-x-1/2 truncate text-[12px] font-medium">Projects</span>
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
