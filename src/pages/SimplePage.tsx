import { useEffect, useRef, useState } from 'react'
import SimpleHero from '../components/simple/SimpleHero'
import SimpleSecond from '../components/simple/SimpleSecond'
import Robot3D from '../components/simple/Robot3D'
import Header from '../components/Header'
import Loader from '../components/Loader'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import { clamp } from '../hooks/usePointer'

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * Arrow + dotted trail — behaviour reproduced from the project.mp4 reference:
 *
 *   There is NO pre-existing dotted path on the page.
 *   The arrow travels (scroll-driven). Wherever it has already travelled,
 *   the dotted trail exists — nothing before the arrow, nothing after it.
 *
 * Implementation: one bezier path in pixel space. The dotted stroke is a
 * static pattern; a <mask> band grows from the path start exactly as far as
 * the arrow has gone (mask dash length = scroll progress × path length).
 * The arrow sits at the same arc length, so the two are synchronized by
 * construction. No timers, no independent animation — scroll is the only
 * input.
 */

// Travel path, normalized to the hero+second area: down through the hero,
// then one big smooth sweep right → down → left along the bottom of the
// second section.
type Vec2 = [number, number]
const PATH_SEGS: [Vec2, Vec2, Vec2, Vec2][] = [
  // hero: starts behind the robot (center), curves down-left
  [[0.5, 0.394], [0.38, 0.4143], [0.292, 0.4565], [0.252, 0.5208]],
  // second: continues left, then begins the long sweep
  [[0.252, 0.5208], [0.212, 0.5869], [0.232, 0.6508], [0.312, 0.7022]],
  // the big smooth sweep right — flows out along the robot's waist line
  // (control points are tangent-continuous at the joints, so the travel
  // reads as one flowing curve — no kinks)
  [[0.312, 0.7022], [0.4396, 0.7836], [0.6042, 0.79], [0.7014, 0.794]],
  // curves down on the right side of the sweep
  [[0.7014, 0.794], [0.7674, 0.7969], [0.7931, 0.8623], [0.7764, 0.9115]],
  // settles left along the bottom
  [[0.7764, 0.9115], [0.766, 0.9415], [0.625, 0.9838], [0.5361, 0.9792]],
]

// The wavy divider at the bottom of the hero (viewBox 1440 x 220) — used to
// know where cream ends and dark begins so trail + arrow colors switch there.
const WAVE_SEGS: [Vec2, Vec2, Vec2, Vec2][] = [
  [[0, 120], [180, 92], [320, 42], [520, 86]],
  [[520, 86], [680, 118], [840, 158], [1040, 96]],
  [[1040, 96], [1180, 48], [1320, 36], [1440, 78]],
]

function cubicAt(p0: Vec2, c1: Vec2, c2: Vec2, p1: Vec2, t: number): Vec2 {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [
    a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0],
    a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1],
  ]
}

/** y of the wavy divider at x (in the wave's 1440-wide space), bisection. */
function waveYAt(x: number): number {
  for (const [p0, c1, c2, p1] of WAVE_SEGS) {
    if (x < p0[0] || x > p1[0]) continue
    let lo = 0
    let hi = 1
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (cubicAt(p0, c1, c2, p1, mid)[0] < x) lo = mid
      else hi = mid
    }
    return cubicAt(p0, c1, c2, p1, (lo + hi) / 2)[1]
  }
  return 120
}

type TrailGeom = {
  pts: Vec2[]
  cum: number[]
  total: number
  d: string
  /** document-y where cream ends (top of the wavy divider under the path) */
  switchY: number
}

function buildTrail(areaW: number, areaH: number, heroH: number, waveH: number): TrailGeom {
  const segs = PATH_SEGS.map(([p0, c1, c2, p1]) => [
    [p0[0] * areaW, p0[1] * areaH],
    [c1[0] * areaW, c1[1] * areaH],
    [c2[0] * areaW, c2[1] * areaH],
    [p1[0] * areaW, p1[1] * areaH],
  ] as [Vec2, Vec2, Vec2, Vec2])

  const STEPS = 120
  const pts: Vec2[] = []
  let d = ''
  for (let s = 0; s < segs.length; s++) {
    const [p0, c1, c2, p1] = segs[s]
    // joint points are shared between segments — emit them once
    d += `${s === 0 ? `M ${p0[0].toFixed(2)} ${p0[1].toFixed(2)}` : ''} C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`
    const start = s === 0 ? 0 : 1
    for (let i = start; i <= STEPS; i++) pts.push(cubicAt(p0, c1, c2, p1, i / STEPS))
  }

  const cum: number[] = [0]
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0]
    const dy = pts[i][1] - pts[i - 1][1]
    cum.push(cum[i - 1] + Math.hypot(dx, dy))
  }

  // where does the path cross the wavy divider? (single crossing, mid-hero)
  const boundaryY = (xPx: number) => heroH - waveH + (waveYAt((xPx / Math.max(1, areaW)) * 1440) / 220) * waveH
  let switchY = heroH
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][1] >= boundaryY(pts[i][0]) && pts[i - 1][1] < boundaryY(pts[i - 1][0])) {
      switchY = boundaryY(pts[i][0])
      break
    }
  }

  return { pts, cum, total: cum[cum.length - 1], d, switchY }
}

function pointAt(g: TrailGeom, dist: number): { x: number; y: number; ang: number } {
  const { pts, cum, total } = g
  const dd = Math.max(0, Math.min(total, dist))
  let lo = 0
  let hi = cum.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= dd) lo = mid
    else hi = mid
  }
  const span = cum[lo + 1] - cum[lo] || 1
  const t = (dd - cum[lo]) / span
  const x = pts[lo][0] + (pts[lo + 1][0] - pts[lo][0]) * t
  const y = pts[lo][1] + (pts[lo + 1][1] - pts[lo][1]) * t
  const ang = (Math.atan2(pts[lo + 1][1] - pts[lo][1], pts[lo + 1][0] - pts[lo][0]) * 180) / Math.PI
  return { x, y, ang }
}

const TRAIL_LAG = 34 // trail tail stays this many px behind the (bigger) arrow tip

/** Robot handoff ramp: 0 in the hero → 1 once the section-2 perch is reached.
 *  Robot3D uses the same ramp for its 45° left TURN, so pose and position
 *  finish together. */
const robotSettle = (p: number) => smoothstep(clamp((p - 0.12) / 0.33, 0, 1))

/**
 * Exponential-follower time-constant for the shared smoothed scroll scalar.
 * Scroll arrives in steps (wheel notches / trackpad jumps); filtering it
 * through one follower turns those steps into a single continuous glide that
 * drives the trail, the arrow, the robot journey and the section reveals
 * together — one shared clock, so nothing ever lags behind anything else.
 */
const SMOOTH_TAU = 0.16

export default function SimplePage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const trailPathRef = useRef<SVGPathElement>(null)
  const maskPathRef = useRef<SVGPathElement>(null)
  const gradYRef = useRef<SVGLinearGradientElement>(null)
  const stop1Ref = useRef<SVGStopElement>(null)
  const stop2Ref = useRef<SVGStopElement>(null)
  const stop3Ref = useRef<SVGStopElement>(null)
  const stop4Ref = useRef<SVGStopElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const robotBoxRef = useRef<HTMLDivElement>(null)
  const trailGeom = useRef<TrailGeom | null>(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  // smoothed scroll scalar — the single shared input for the trail, the
  // arrow, the robot journey and the section reveals (advanced in the
  // journey rAF loop below)
  const smoothRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [robotReady, setRobotReady] = useState(false)

  // arrow position + trail reveal — both derived from the same scroll value.
  // Written directly to the DOM inside the scroll rAF (no React round-trip),
  // so the trail is frame-accurate with the arrow.
  const applyTrailRef = useRef<(p: number) => void>(() => {})
  applyTrailRef.current = applyTrail

  // scroll progress: 0 at the top → 1 at the very bottom of the page.
  // Only the RAW value is recorded here; the journey rAF loop smooths it
  // (smoothRef) and derives everything else — trail, arrow, robot, reveals.
  useEffect(() => {
    if (!loaderGone) return
    let raf = 0
    let first = true
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const wrap = wrapperRef.current
        if (!wrap) return
        const total = wrap.scrollHeight - window.innerHeight
        const p = Math.max(0, Math.min(1, window.scrollY / Math.max(1, total)))
        progressRef.current = p
        if (first) {
          // first read — also covers a mid-page reload: start already
          // settled so the page never does a catch-up sweep
          first = false
          smoothRef.current = p
          setProgress(p)
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaderGone])

  // build the pixel-space path + install the growing mask
  useEffect(() => {
    if (!ready) return
    const build = () => {
      const area = areaRef.current
      const hero = heroRef.current
      const dotted = trailPathRef.current
      const mask = maskPathRef.current
      if (!area || !hero || !dotted || !mask) return
      const w = area.clientWidth
      const h = area.clientHeight
      const heroH = hero.offsetHeight
      // the wavy divider container is the hero's last child
      const waveH = (hero.lastElementChild as HTMLElement | null)?.offsetHeight || 146
      const g = buildTrail(w, h, heroH, waveH)
      trailGeom.current = g
      dotted.setAttribute('d', g.d)
      mask.setAttribute('d', g.d)
      const grad = gradYRef.current
      if (grad) {
        grad.setAttribute('y2', String(h))
        const b = Math.max(14, h * 0.012)
        const f = (v: number) => Math.max(0, Math.min(1, v / h))
        stop1Ref.current?.setAttribute('offset', '0')
        stop2Ref.current?.setAttribute('offset', f(g.switchY - b).toFixed(4))
        stop3Ref.current?.setAttribute('offset', f(g.switchY + b).toFixed(4))
        stop4Ref.current?.setAttribute('offset', '1')
      }
      applyTrail(smoothRef.current)
    }
    build()
    window.addEventListener('resize', build)
    return () => window.removeEventListener('resize', build)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  /**
   * Robot journey — hero → second section. This rAF loop is also the
   * master loop for the page's scroll-driven motion:
   *
   *   · in the hero the robot stands centred, facing the viewer (the trail
   *     emerges behind it)
   *   · on the way down it hands off to a perch in the UPPER-RIGHT of the
   *     second section, turned 45° LEFT (a horizontal turn — it stays
   *     perfectly upright) so it faces the content on the left side
   *   · the perch is document-anchored, so once there the robot rides the
   *     scroll and exits the top edge with the section (no fade, no hover
   *     over the footer). The trail curve sits below the perch, so arrow
   *     and trail always pass clear of it.
   *
   * Smoothness: scroll arrives in steps (wheel notches). One exponential
   * follower (SMOOTH_TAU) turns it into a continuous scalar `sp`, and the
   * trail, the arrow, the robot pose/scale and the section reveals all
   * derive from that SAME scalar — one shared clock, so nothing lags
   * behind anything else, at any scroll speed. The perch endpoint itself
   * uses raw scrollY, so once perched the robot moves 1:1 with the page;
   * only the handoff blend, the gentle arc, the scale and the turn ease.
   */
  useEffect(() => {
    if (!ready) return
    const box = robotBoxRef.current
    if (!box) return
    let raf = 0
    let last = performance.now()
    let lastSent = smoothRef.current

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const w = window.innerWidth
      const h = window.innerHeight
      const desk = w >= 1024

      // advance the shared smoothed scalar toward the raw scroll progress
      const raw = progressRef.current
      const sm = smoothRef.current
      smoothRef.current =
        Math.abs(raw - sm) < 1e-5 ? raw : sm + (raw - sm) * (1 - Math.exp(-dt / SMOOTH_TAU))
      const sp = smoothRef.current

      const s = robotSettle(sp)
      const scrollY = window.scrollY

      // hero anchor (viewport px) — where the robot stands at rest
      const hx = w * 0.5
      const hy = h * (desk ? 0.48 : 0.5)

      let tx: number, ty: number, ts: number, to: number
      if (desk) {
        // perch (doc px): upper right of the second section, clear of the
        // trail (which runs along the section's bottom) and of the rope
        // at the right edge
        const heroH = heroRef.current?.offsetHeight ?? h
        const secH = secondRef.current?.offsetHeight ?? h * 0.92
        const px = w / 2 + 0.52 * Math.min(640, Math.min(1240, w - 48) / 2)
        const py = heroH + 0.2 * secH
        tx = hx + (px - hx) * s
        ty = hy + (py - scrollY - hy) * s
        ts = 1 - 0.38 * s
        to = 1
      } else {
        // mobile: content is full-width, so no perch — drift up-right and
        // fade out as the section takes over
        tx = hx + (w * 0.62 - hx) * s
        ty = hy + (h * 0.34 - hy) * s
        ts = 1 - 0.5 * s
        to = 1 - smoothstep(clamp((sp - 0.4) / 0.16, 0, 1))
      }
      // a gentle upward arc through the handoff (zero at both ends), so
      // the glide reads as an organic flit rather than a straight diagonal
      const arc = (desk ? 56 : 26) * Math.sin(Math.PI * s)
      const baseY = desk ? h * 0.48 : h * 0.5
      box.style.transform =
        `translate(-50%, -50%) translate(${(tx - w / 2).toFixed(1)}px, ${(ty - baseY - arc).toFixed(1)}px) scale(${ts.toFixed(4)})`
      box.style.opacity = to.toFixed(3)

      // trail + arrow derive from the same scalar — synced by construction
      applyTrailRef.current(sp)

      // section reveals + robot pose (Robot3D) share the same scalar too;
      // only notify React while it's actually moving
      if (Math.abs(sp - lastSent) > 0.0004) {
        lastSent = sp
        setProgress(sp)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // arrow position + trail reveal — both derived from the same scroll value
  function applyTrail(p: number) {
    const g = trailGeom.current
    const arrow = arrowRef.current
    const mask = maskPathRef.current
    if (!g || !arrow) return
    const drawn = p * g.total
    const { x, y, ang } = pointAt(g, drawn)

    // arrow fades in from behind the robot as it slides out from behind it
    let op = p <= 0.02 ? 0 : Math.min(1, (p - 0.02) / 0.08)
    let ax = x
    let ay = y
    if (p > 0.9) {
      // flies out along its tangent while fading, as the journey completes
      const e = (p - 0.9) / 0.1
      op *= 1 - e
      ax += Math.cos((ang * Math.PI) / 180) * e * 80
      ay += Math.sin((ang * Math.PI) / 180) * e * 80
    }
    arrow.style.opacity = op.toFixed(3)
    const grow = 0.9 + 0.1 * Math.min(1, p * 20)
    arrow.style.transform = `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px) translate(-50%, -50%) rotate(${ang.toFixed(2)}deg) scale(${grow.toFixed(3)})`
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    arrow.style.color = y < g.switchY ? '#1B1A17' : desktop ? '#F2AFA0' : '#FFFFFF'

    // the trail exists exactly where the arrow has already travelled
    if (mask) {
      const reveal = Math.max(0, Math.min(g.total, drawn - TRAIL_LAG))
      mask.style.strokeDasharray = `${reveal.toFixed(1)} ${(g.total + 64).toFixed(1)}`
    }
  }

  return (
    <div ref={wrapperRef} className="relative min-h-screen bg-cream">
      {!loaderGone && <Loader onReveal={() => setReady(true)} onGone={() => setLoaderGone(true)} waitFor={() => robotReady} />}

      {/* robot — mounted immediately so the GLB loads under the loader;
          the opaque loader covers it until the model has rendered a frame.
          Position/size are driven by the journey rAF loop (ref-based). */}
      <div className="pointer-events-none fixed inset-0 z-[6]">
        <div
          ref={robotBoxRef}
          className="absolute left-1/2 top-[50%] h-[min(60vh,520px)] w-[min(86vw,360px)] will-change-transform lg:top-[48%] lg:h-[min(76vh,680px)] lg:w-[min(40vw,520px)]"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Robot3D scrollProgress={progress} onReady={() => setRobotReady(true)} />
        </div>
      </div>

      {ready && (
        <>
          <Header />
          {/* same hanging robot + rope as the main page (rides the right edge) */}
          <ScrollRope />

          <div ref={areaRef} className="relative">
            {/* dotted trail — PRODUCED by the arrow (mask band grows with scroll) */}
            <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
              <svg className="absolute inset-0 block h-full w-full" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="cc-trail-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100" ref={gradYRef}>
                    <stop ref={stop1Ref} offset="0" stopColor="#111111" stopOpacity="0.22" />
                    <stop ref={stop2Ref} offset="0.5" stopColor="#111111" stopOpacity="0.22" />
                    <stop ref={stop3Ref} offset="0.5" stopColor="#FFFFFF" stopOpacity="0.88" />
                    <stop ref={stop4Ref} offset="1" stopColor="#FFFFFF" stopOpacity="0.88" />
                  </linearGradient>
                  <mask id="cc-trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                    <path
                      ref={maskPathRef}
                      d="M 0 0"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="9"
                      // butt caps: a zero-length dash must not render a dot at the path start
                      strokeLinecap="butt"
                      style={{ strokeDasharray: '0 999999' }}
                    />
                  </mask>
                </defs>
                <path
                  ref={trailPathRef}
                  d="M 0 0"
                  fill="none"
                  stroke="url(#cc-trail-grad)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeDasharray="12 11"
                  mask="url(#cc-trail-mask)"
                />
              </svg>
              <div
                ref={arrowRef}
                className="absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0, transition: 'color 240ms linear' }}
              >
                <svg width="46" height="46" viewBox="0 0 32 32" fill="none" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.32)]">
                  <path d="M28.2 4.2L4.1 14.6l8.4 4.7 3.7 9.1 12-24.2z" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div ref={heroRef}>
              <SimpleHero />
            </div>
            <div ref={secondRef}>
              <SimpleSecond progress={progress} />
            </div>
          </div>

          {/* same footer as the main page (replaces the "next project" stub) */}
          <Footer />
        </>
      )}
    </div>
  )
}
