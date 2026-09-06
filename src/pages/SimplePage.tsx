import { useEffect, useRef, useState } from 'react'
import SimpleHero from '../components/simple/SimpleHero'
import SimpleSecond from '../components/simple/SimpleSecond'
import SimpleThird from '../components/simple/SimpleThird'
import Robot3D from '../components/simple/Robot3D'
import Header from '../components/Header'
import Loader from '../components/Loader'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import { clamp } from '../hooks/usePointer'
import { pinBudget } from '../components/simple/lineGeom'

const smoothstep = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Arrow + dotted trail — behaviour reproduced from the project.mp4 reference:
 *
 *   There is NO pre-existing dotted path on the page.
 *   The arrow travels (scroll-driven). Wherever it has already travelled,
 *   the dotted trail exists — nothing before the arrow, nothing after it.
 *
 * One bezier path in pixel space over the hero+section-2 area. The dotted
 * stroke is a static pattern; a <mask> band grows from the path start exactly
 * as far as the arrow has gone. The arrow sits at the same arc length, so the
 * two are synchronized by construction.
 *
 * Because section 2 lives inside the pinned stage (section 3 freezes it in
 * place while the orange dome rises over it), the trail + arrow are split in
 * two: part A rides the hero in normal flow, part B lives inside the stage so
 * it stays frozen with the section. They hand the arrow over exactly at the
 * hero/section boundary — the arrow is pixel-identical on both sides of it.
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
  d: string // part A — hero+second area coordinates
  dB: string // part B — same path shifted up by heroH (section-2 local)
  /** arc length where the path crosses the hero/section boundary */
  Lb: number
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
  let dB = ''
  for (let s = 0; s < segs.length; s++) {
    const [p0, c1, c2, p1] = segs[s]
    // joint points are shared between segments — emit them once
    d += `${s === 0 ? `M ${p0[0].toFixed(2)} ${p0[1].toFixed(2)}` : ''} C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`
    dB += `${s === 0 ? `M ${p0[0].toFixed(2)} ${(p0[1] - heroH).toFixed(2)}` : ''} C ${c1[0].toFixed(2)} ${(c1[1] - heroH).toFixed(2)}, ${c2[0].toFixed(2)} ${(c2[1] - heroH).toFixed(2)}, ${p1[0].toFixed(2)} ${(p1[1] - heroH).toFixed(2)}`
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

  // where does the path cross the flat hero/section boundary (y = heroH)?
  let Lb = cum[cum.length - 1]
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][1] >= heroH - 0.5 && pts[i - 1][1] < heroH - 0.5) {
      const t = (heroH - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] || 1)
      Lb = cum[i - 1] + t * (cum[i] - cum[i - 1])
      break
    }
  }

  return { pts, cum, total: cum[cum.length - 1], d, dB, Lb, switchY }
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
 *  finish together. (The domain is the pre-pin scroll: hero → section 2.) */
const robotSettle = (p: number) => smoothstep(clamp((p - 0.12) / 0.33, 0, 1))

/**
 * Exponential-follower time-constant for the shared smoothed scroll scalar.
 * Scroll arrives in steps (wheel notches); filtering it through one follower
 * turns those steps into a single continuous glide that drives the trail, the
 * arrow, the robot journey and the section reveals together — one shared
 * clock, so nothing ever lags behind anything else.
 */
const SMOOTH_TAU = 0.16

export default function SimplePage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const pinWrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pathARef = useRef<SVGPathElement>(null)
  const maskARef = useRef<SVGPathElement>(null)
  const gradARef = useRef<SVGLinearGradientElement>(null)
  const aStop1 = useRef<SVGStopElement>(null)
  const aStop2 = useRef<SVGStopElement>(null)
  const aStop3 = useRef<SVGStopElement>(null)
  const aStop4 = useRef<SVGStopElement>(null)
  const arrowARef = useRef<HTMLDivElement>(null)
  const pathBRef = useRef<SVGPathElement>(null)
  const maskBRef = useRef<SVGPathElement>(null)
  const arrowBRef = useRef<HTMLDivElement>(null)
  const robotBoxRef = useRef<HTMLDivElement>(null)
  const trailGeom = useRef<TrailGeom | null>(null)
  const geom = useRef({
    heroH: 0,
    secH: 0,
    total: 0,
    Lb: 0,
    switchY: 0,
    dist: 0,
    domeEnd: 1,
    headEnd: 2,
    spinEnd: 3,
    dropEnd: 4,
    pinPx: 100,
  })
  const [progress, setProgress] = useState(0)
  const [third, setThird] = useState({ q1: 0, q2: 0, qSpin: 0, qDrop: 0, qPan: 0 })
  const progressRef = useRef(0)
  // smoothed scroll scalar (fraction of the whole page) — the single shared
  // input for the trail, the arrow, the robot journey and section 3
  const smoothRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [robotReady, setRobotReady] = useState(false)

  // trail part A (over the hero) + part B (over the frozen section 2) — both
  // derived from the same smoothed value, written directly to the DOM.
  const applyARef = useRef<(drawn: number) => void>(() => {})
  applyARef.current = (drawn) => {
    const g = trailGeom.current
    const arrow = arrowARef.current
    const mask = maskARef.current
    if (!g || !arrow) return
    const reveal = Math.max(0, Math.min(g.Lb, drawn - TRAIL_LAG))
    if (mask) mask.style.strokeDasharray = `${reveal.toFixed(1)} ${(g.total + 64).toFixed(1)}`
    const { x, y, ang } = pointAt(g, drawn)
    // arrow fades in from behind the robot, then hands over to part B at the
    // hero/section boundary
    let op = drawn <= 0.02 * g.total ? 0 : Math.min(1, (drawn - 0.02 * g.total) / (0.08 * g.total))
    if (drawn >= g.Lb) op = 0
    arrow.style.opacity = op.toFixed(3)
    const grow = 0.9 + 0.1 * Math.min(1, (drawn / g.total) * 20)
    arrow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${ang.toFixed(2)}deg) scale(${grow.toFixed(3)})`
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    arrow.style.color = y < g.switchY ? '#1B1A17' : desktop ? '#F2AFA0' : '#FFFFFF'
  }

  const applyBRef = useRef<(pA: number, drawn: number) => void>(() => {})
  applyBRef.current = (pA, drawn) => {
    const g = trailGeom.current
    const hero = heroRef.current
    const arrow = arrowBRef.current
    const mask = maskBRef.current
    if (!g || !arrow || !hero) return
    const heroH = hero.offsetHeight
    const reveal = Math.max(0, Math.min(g.total - g.Lb, drawn - g.Lb - TRAIL_LAG))
    if (mask) mask.style.strokeDasharray = `${reveal.toFixed(1)} ${(g.total + 64).toFixed(1)}`
    const { x, y, ang } = pointAt(g, drawn)
    const ay = y - heroH
    let op = drawn < g.Lb ? 0 : 1
    if (pA > 0.9) {
      // flies out along its tangent while fading, as the journey completes
      const e = (pA - 0.9) / 0.1
      op *= 1 - e
    }
    arrow.style.opacity = op.toFixed(3)
    const grow = 0.9 + 0.1 * Math.min(1, (drawn / g.total) * 20)
    arrow.style.transform = `translate(${x.toFixed(1)}px, ${ay.toFixed(1)}px) translate(-50%, -50%) rotate(${ang.toFixed(2)}deg) scale(${grow.toFixed(3)})`
    const desktop = window.matchMedia('(min-width: 1024px)').matches
    arrow.style.color = desktop ? '#F2AFA0' : '#FFFFFF'
  }

  // scroll progress: 0 at the top → 1 at the very bottom of the page.
  // Only the RAW value is recorded here; the journey rAF loop smooths it
  // (smoothRef) and derives everything else.
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

  // build the pixel-space path (both parts) + pin budget + install the masks
  useEffect(() => {
    if (!ready) return
    const build = () => {
      const hero = heroRef.current
      const sec = secondRef.current
      const pathA = pathARef.current
      const maskA = maskARef.current
      const pathB = pathBRef.current
      const maskB = maskBRef.current
      if (!hero || !sec || !pathA || !maskA || !pathB || !maskB) return
      const w = window.innerWidth
      const h = window.innerHeight
      const heroH = hero.offsetHeight
      const secH = sec.offsetHeight
      const areaH = heroH + secH
      // the wavy divider container is the hero's last child
      const waveH = (hero.lastElementChild as HTMLElement | null)?.offsetHeight || 146
      const g = buildTrail(w, areaH, heroH, waveH)
      trailGeom.current = g
      pathA.setAttribute('d', g.d)
      maskA.setAttribute('d', g.d)
      pathB.setAttribute('d', g.dB)
      maskB.setAttribute('d', g.dB)
      // part A gradient: ink → (salmon/white) across the wavy divider
      const grad = gradARef.current
      if (grad) {
        grad.setAttribute('y2', String(heroH))
        const b = Math.max(14, heroH * 0.015)
        const f = (v: number) => Math.max(0, Math.min(1, v / heroH))
        aStop1.current?.setAttribute('offset', '0')
        aStop2.current?.setAttribute('offset', f(g.switchY - b).toFixed(4))
        aStop3.current?.setAttribute('offset', f(g.switchY + b).toFixed(4))
        aStop4.current?.setAttribute('offset', '1')
      }
      // part B lives below the divider — a single solid colour
      const desktop = w >= 1024
      pathB.setAttribute('stroke', desktop ? '#F2AFA0' : '#FFFFFF')

      const budget = pinBudget(w, h)
      geom.current = {
        heroH,
        secH,
        total: g.total,
        Lb: g.Lb,
        switchY: g.switchY,
        dist: budget.dist,
        domeEnd: budget.domeEnd,
        headEnd: budget.headEnd,
        spinEnd: budget.spinEnd,
        dropEnd: budget.dropEnd,
        pinPx: budget.pinPx,
      }
      // the pin wrapper = the sticky stage + its scroll budget
      requestAnimationFrame(() => {
        const wrap = pinWrapRef.current
        const stage = stageRef.current
        if (wrap && stage) wrap.style.height = stage.offsetHeight + budget.pinPx + 'px'
      })
      applyARef.current(0)
      applyBRef.current(0, 0)
    }
    build()
    window.addEventListener('resize', build)
    let alive = true
    document.fonts?.ready?.then(() => {
      if (alive) build()
    })
    return () => {
      alive = false
      window.removeEventListener('resize', build)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  /**
   * Master scroll loop — robot journey + trail + section 3.
   *
   *   · the hero stands with the robot centred, facing the viewer (the trail
   *     emerges behind it)
   *   · on the way down the robot hands off to its perch in the UPPER-RIGHT
   *     of the second section (inside the rectangle of the empty right
   *     column), turned 45° LEFT — a horizontal turn, it stays perfectly
   *     upright — so it faces the content on the left. It is NEVER scaled
   *     down. The perch is document-anchored.
   *   · once section 2 is fully in view, the pin starts: section 2 freezes in
   *     place, and the orange dome of section 3 rises over it. The robot is
   *     stage-aware, so it freezes with the section and exits the top with
   *     it when the pin ends.
   *
   * Smoothness: scroll arrives in steps (wheel notches). One exponential
   * follower (SMOOTH_TAU) turns it into a continuous scalar, and the trail,
   * the arrow, the robot pose, the section-2 reveals and the section-3
   * phases all derive from that SAME scalar — one shared clock.
   */
  useEffect(() => {
    if (!ready) return
    const box = robotBoxRef.current
    if (!box) return
    let raf = 0
    let last = performance.now()
    let lastPA = 0
    let lastThird = { q1: -1, q2: -1, qSpin: -1, qDrop: -1, qPan: -1 }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const wrap = wrapperRef.current
      if (!wrap) {
        raf = requestAnimationFrame(tick)
        return
      }
      const w = window.innerWidth
      const h = window.innerHeight
      const desk = w >= 1024
      const G = geom.current
      const maxScroll = Math.max(1, wrap.scrollHeight - h)

      // advance the shared smoothed scalar toward the raw scroll fraction
      const raw = progressRef.current
      const sm = smoothRef.current
      smoothRef.current =
        Math.abs(raw - sm) < 1e-5 ? raw : sm + (raw - sm) * (1 - Math.exp(-dt / SMOOTH_TAU))
      const sp = smoothRef.current
      const px = sp * maxScroll

      // pre-pin scroll (hero → section 2) drives the trail, the robot and
      // the section-2 reveals — all of it completes exactly when the pin
      // starts, so nothing is mid-motion while the section freezes
      const pA = Math.max(0, Math.min(1, px / Math.max(1, G.heroH)))
      const s = robotSettle(pA)
      const pinLocal = Math.max(0, px - G.heroH)

      // hero anchor (viewport px) — where the robot stands at rest
      const hx = w * 0.5
      const hy = h * (desk ? 0.48 : 0.5)

      let tx: number, ty: number, to: number
      if (desk) {
        // perch: centre of the empty right column of section 2 (the drawn
        // rectangle), doc px. Stays full size — no shrinking, at all.
        const prx = w * 0.773
        const pry = G.heroH + 0.42 * G.secH
        tx = hx + (prx - hx) * s
        // stage-aware doc anchor: 1:1 with the page before the pin, frozen
        // while the stage is pinned, exits with the stage after the pin
        const effScroll = Math.min(Math.max(px, G.heroH), G.heroH + G.pinPx)
        const stageOff = effScroll - px
        const perchViewY = (pry - G.heroH) + stageOff
        ty = hy + (perchViewY - hy) * s
        to = 1
      } else {
        // mobile: content is full-width, so no perch — drift up-right and
        // fade out as the section takes over (before the pin starts)
        tx = hx + (w * 0.62 - hx) * s
        ty = hy + (h * 0.34 - hy) * s
        to = 1 - smoothstep(clamp((pA - 0.4) / 0.16, 0, 1))
      }
      // a gentle upward arc through the handoff (zero at both ends), so the
      // glide reads as an organic flit rather than a straight diagonal
      const arc = (desk ? 56 : 26) * Math.sin(Math.PI * s)
      const baseY = desk ? h * 0.48 : h * 0.5
      box.style.transform =
        `translate(-50%, -50%) translate(${(tx - w / 2).toFixed(1)}px, ${(ty - baseY - arc).toFixed(1)}px)`
      box.style.opacity = to.toFixed(3)

      // trail + arrow derive from the same scalar — synced by construction
      const drawn = pA * G.total
      applyARef.current(drawn)
      applyBRef.current(pA, drawn)

      // section 3 phases (linear in scroll; SimpleThird eases them)
      const q1 = clamp01(pinLocal / G.domeEnd)
      const q2 = clamp01((pinLocal - G.domeEnd) / Math.max(1, G.headEnd - G.domeEnd))
      const qSpin = clamp01((pinLocal - G.headEnd) / Math.max(1, G.spinEnd - G.headEnd))
      const qDrop = clamp01((pinLocal - G.spinEnd) / Math.max(1, G.dropEnd - G.spinEnd))
      const qPan = clamp01((pinLocal - G.dropEnd) / Math.max(1, G.dist))

      if (Math.abs(pA - lastPA) > 0.0004) {
        lastPA = pA
        setProgress(pA)
      }
      if (
        Math.abs(q1 - lastThird.q1) > 0.0008 ||
        Math.abs(q2 - lastThird.q2) > 0.0008 ||
        Math.abs(qSpin - lastThird.qSpin) > 0.0004 ||
        Math.abs(qDrop - lastThird.qDrop) > 0.0008 ||
        Math.abs(qPan - lastThird.qPan) > 0.0008
      ) {
        lastThird = { q1, q2, qSpin, qDrop, qPan }
        setThird({ q1, q2, qSpin, qDrop, qPan })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const arrowSvg = (
    <svg width="46" height="46" viewBox="0 0 32 32" fill="none" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.32)]">
      <path d="M28.2 4.2L4.1 14.6l8.4 4.7 3.7 9.1 12-24.2z" fill="currentColor" />
    </svg>
  )

  return (
    <div ref={wrapperRef} className="relative min-h-screen bg-cream">
      {!loaderGone && <Loader onReveal={() => setReady(true)} onGone={() => setLoaderGone(true)} waitFor={() => robotReady} />}

      {ready && (
        <>
          <Header />
          {/* same hanging robot + rope as the main page (rides the right edge) */}
          <ScrollRope />

          {/* ——— hero (in normal flow) + trail part A over it ——— */}
          <div className="relative">
            <div ref={heroRef}>
              <SimpleHero />
            </div>
            <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
              <svg className="absolute inset-0 block h-full w-full">
                <defs>
                  <linearGradient id="cc-trail-grad-a" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100" ref={gradARef}>
                    <stop ref={aStop1} offset="0" stopColor="#111111" stopOpacity="0.22" />
                    <stop ref={aStop2} offset="0.5" stopColor="#111111" stopOpacity="0.22" />
                    <stop ref={aStop3} offset="0.5" stopColor="#FFFFFF" stopOpacity="0.88" />
                    <stop ref={aStop4} offset="1" stopColor="#FFFFFF" stopOpacity="0.88" />
                  </linearGradient>
                  <mask id="cc-trail-mask-a" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                    <path
                      ref={maskARef}
                      d="M 0 0"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="9"
                      strokeLinecap="butt"
                      style={{ strokeDasharray: '0 999999' }}
                    />
                  </mask>
                </defs>
                <path
                  ref={pathARef}
                  d="M 0 0"
                  fill="none"
                  stroke="url(#cc-trail-grad-a)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeDasharray="12 11"
                  mask="url(#cc-trail-mask-a)"
                />
              </svg>
              <div
                ref={arrowARef}
                className="absolute left-0 top-0 will-change-transform"
                style={{ opacity: 0, transition: 'color 240ms linear' }}
              >
                {arrowSvg}
              </div>
            </div>
          </div>

          {/* ——— the pin: section 2 freezes here while section 3 rises ——— */}
          <div ref={pinWrapRef} className="relative">
            <div ref={stageRef} className="sticky top-0 z-0 min-h-[100svh] overflow-hidden">
              {/* robot — inside the stage so it freezes with the section and
                  gets covered by the orange dome (above section-2 content,
                  below the orange). Still viewport-fixed + doc-anchored. */}
              <div className="pointer-events-none fixed inset-0 z-[6]">
                <div
                  ref={robotBoxRef}
                  className="absolute left-1/2 top-[50%] h-[min(60vh,520px)] w-[min(86vw,360px)] will-change-transform lg:top-[48%] lg:h-[min(76vh,680px)] lg:w-[min(40vw,520px)]"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <Robot3D scrollProgress={progress} onReady={() => setRobotReady(true)} />
                </div>
              </div>

              {/* section 2 (frozen while the pin holds) + trail part B */}
              <div ref={secondRef} className="relative">
                <SimpleSecond progress={progress} />
                <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
                  <svg className="absolute inset-0 block h-full w-full">
                    <defs>
                      <mask id="cc-trail-mask-b" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                        <path
                          ref={maskBRef}
                          d="M 0 0"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="9"
                          strokeLinecap="butt"
                          style={{ strokeDasharray: '0 999999' }}
                        />
                      </mask>
                    </defs>
                    <path
                      ref={pathBRef}
                      d="M 0 0"
                      fill="none"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeDasharray="12 11"
                      mask="url(#cc-trail-mask-b)"
                    />
                  </svg>
                  <div
                    ref={arrowBRef}
                    className="absolute left-0 top-0 will-change-transform"
                    style={{ opacity: 0, transition: 'color 240ms linear' }}
                  >
                    {arrowSvg}
                  </div>
                </div>
              </div>

              {/* dark bridge so section 2's dark background carries to the
                  bottom of the stage (where the orange dome rises from) */}
              <div className="h-[8svh] w-full bg-[#08080A]" />

              {/* section 3 — the orange dome, the heading, the spinning previews, the clothesline */}
              <SimpleThird q1={third.q1} q2={third.q2} qSpin={third.qSpin} qDrop={third.qDrop} qPan={third.qPan} />
            </div>
          </div>

          {/* same footer as the main page — arrives when the line ends */}
          <Footer />
        </>
      )}
    </div>
  )
}
