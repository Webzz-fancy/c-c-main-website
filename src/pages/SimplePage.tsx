import { memo, useCallback, useEffect, useRef, useState } from 'react'
import SimpleHero from '../components/simple/SimpleHero'
import SimpleSecond from '../components/simple/SimpleSecond'
import SimpleThird, { THIRD_BG } from '../components/simple/SimpleThird'
import ProjectSheet from '../components/simple/ProjectSheet'
import { PROJECTS } from '../components/simple/lineGeom'
import SimpleTalk from '../components/simple/SimpleTalk'
import Robot3D, { preloadRobot } from '../components/simple/Robot3D'
import Header from '../components/Header'
import Loader from '../components/Loader'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'

// the journey loop updates React state every frame while the arrow travels;
// these parts of the page don't depend on it, so they must not re-render
// with it (keeps each frame's JS work down to what actually changes)
const MemoHeader = memo(Header)
const MemoFooter = memo(Footer)
const MemoHero = memo(SimpleHero)
const MemoRope = memo(ScrollRope)
const MemoThird = memo(SimpleThird)
const MemoTalk = memo(SimpleTalk)
import { pinBudget } from '../components/simple/lineGeom'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Arrow + dotted trail — behaviour reproduced from the project.mp4 reference:
 *
 *   There is NO pre-existing dotted path on the page.
 *   The arrow travels (scroll-driven). Wherever it has already travelled,
 *   the dotted trail exists — nothing before the arrow, nothing after it.
 *
 * One bezier path in pixel space over the hero+section-2 area. Each frame the
 * dotted path is emitted from the start exactly as far as the arrow has gone
 * (a thin-stroke repaint — no mask surfaces). The arrow sits at the same arc
 * length, so the two are synchronized by construction.
 *
 * The trail + arrow are split in two: part A rides the hero, part B rides
 * section 2 (both in normal flow). They hand the arrow over exactly at the
 * hero/section boundary — the arrow is pixel-identical on both sides of it.
 */

// The travel path, in pixel space, laid out on the measured hero and
// section 2: it starts behind the robot (on the right of the hero), curves
// down and left under the type, crosses into section 2 and arrives — as an
// arrow pointing right, the reference's "A → B" — in the opening row of
// section 2, beside its subheading, just as the cards rise under it.
type Vec2 = [number, number]
type Seg = [Vec2, Vec2, Vec2, Vec2]
function pathSegs(w: number, H: number): Seg[] {
  if (w >= 1024) {
    return [
      // hero: from behind the robot's waist, down-left
      [[0.74 * w, 0.42 * H], [0.66 * w, 0.47 * H], [0.52 * w, 0.6 * H], [0.42 * w, 0.76 * H]],
      // across the boundary, still down-left, bottoming out
      [[0.42 * w, 0.76 * H], [0.32 * w, 0.92 * H], [0.16 * w, H - 30], [0.19 * w, H + 30]],
      // the turn to the right, into the opening row
      [[0.19 * w, H + 30], [0.226 * w, H + 102], [0.22 * w, H + 168], [0.33 * w, H + 168]],
    ]
  }
  return [
    [[0.5 * w, 0.7 * H], [0.42 * w, 0.76 * H], [0.3 * w, 0.86 * H], [0.26 * w, 0.98 * H]],
    [[0.26 * w, 0.98 * H], [0.22 * w, H + 0.03 * H], [0.3 * w, H + 103], [0.62 * w, H + 103]],
  ]
}

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

/** tangent direction of the cubic at t, degrees */
function cubicAngleAt(p0: Vec2, c1: Vec2, c2: Vec2, p1: Vec2, t: number): number {
  const u = 1 - t
  const dx = 3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p1[0] - c2[0])
  const dy = 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p1[1] - c2[1])
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

type TrailGeom = {
  pts: Vec2[]
  /** tangent angle at each point (deg, unwrapped — no ±180° seams) */
  angs: number[]
  cum: number[]
  total: number
  /** "x y" per point, part A (hero+second area coordinates) */
  strA: string[]
  /** "x y" per point, part B (same path shifted up by heroH: section-2 local) */
  strB: string[]
  /** arc length where the path crosses the hero/section boundary */
  Lb: number
  /** document-y of the hero's straight bottom edge (the seam between the two parts) */
  switchY: number
}

function buildTrail(areaW: number, heroH: number): TrailGeom {
  const segs = pathSegs(areaW, heroH)

  const STEPS = 120
  const pts: Vec2[] = []
  const angs: number[] = []
  for (let s = 0; s < segs.length; s++) {
    const [p0, c1, c2, p1] = segs[s]
    // joint points are shared between segments — emit them once
    const start = s === 0 ? 0 : 1
    for (let i = start; i <= STEPS; i++) {
      pts.push(cubicAt(p0, c1, c2, p1, i / STEPS))
      let ang = cubicAngleAt(p0, c1, c2, p1, i / STEPS)
      // unwrap against the previous angle so interpolation never crosses a seam
      const prev = angs.length ? angs[angs.length - 1] : ang
      while (ang - prev > 180) ang -= 360
      while (ang - prev < -180) ang += 360
      angs.push(ang)
    }
  }

  const cum: number[] = [0]
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0]
    const dy = pts[i][1] - pts[i - 1][1]
    cum.push(cum[i - 1] + Math.hypot(dx, dy))
  }

  // the hero ends on a straight edge at y = heroH (cream on both sides now;
  // kept as the seam where part A hands over to part B)
  const switchY = heroH

  // where does the path cross the hero/section boundary (y = heroH)?
  let Lb = cum[cum.length - 1]
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][1] >= heroH - 0.5 && pts[i - 1][1] < heroH - 0.5) {
      const t = (heroH - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1] || 1)
      Lb = cum[i - 1] + t * (cum[i] - cum[i - 1])
      break
    }
  }

  const strA = pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
  const strB = pts.map((p) => `${p[0].toFixed(1)} ${(p[1] - heroH).toFixed(1)}`)
  return { pts, angs, cum, total: cum[cum.length - 1], strA, strB, Lb, switchY }
}

/** index of the last sampled point at or before arc length `dist` */
function indexAt(g: TrailGeom, dist: number): number {
  const { cum } = g
  let lo = 0
  let hi = cum.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= dist) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * The trail between arc lengths `from` and `to` as a path string — the
 * sampled polyline (120 points per curve segment: visually the curve itself)
 * with exact interpolated end points. `dy` shifts it into part B's frame.
 */
function trailD(g: TrailGeom, from: number, to: number, strs: string[], dy: number): string {
  const { pts, cum, total } = g
  const a = Math.max(0, Math.min(total, from))
  const b = Math.max(0, Math.min(total, to))
  if (b - a < 0.5) return ''
  const at = (dist: number) => {
    const i = indexAt(g, dist)
    const span = cum[i + 1] - cum[i] || 1
    const t = Math.min(1, (dist - cum[i]) / span)
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t - dy
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  }
  const i0 = indexAt(g, a) + 1
  const i1 = indexAt(g, b)
  const mid = i1 >= i0 ? ' L ' + strs.slice(i0, i1 + 1).join(' L ') : ''
  return `M ${at(a)}${mid} L ${at(b)}`
}

function pointAt(g: TrailGeom, dist: number): { x: number; y: number; ang: number } {
  const { pts, angs, cum, total } = g
  const dd = Math.max(0, Math.min(total, dist))
  const lo = indexAt(g, dd)
  const span = cum[lo + 1] - cum[lo] || 1
  const t = (dd - cum[lo]) / span
  const x = pts[lo][0] + (pts[lo + 1][0] - pts[lo][0]) * t
  const y = pts[lo][1] + (pts[lo + 1][1] - pts[lo][1]) * t
  // the arrow's heading is the curve's true tangent, interpolated — it
  // turns continuously instead of ticking from one polyline segment to the next
  const ang = angs[lo] + (angs[lo + 1] - angs[lo]) * t
  return { x, y, ang }
}

const TRAIL_LAG = 34 // trail tail stays this many px behind the (bigger) arrow tip
const DASH = '12 11' // the trail's dot pattern (period 23px)
const DASH_PERIOD = 23

/**
 * The shared smoothed scroll scalar is a critically-damped second-order
 * follower of the raw scroll. Scroll arrives in steps (wheel notches); a
 * plain exponential follower turns each step into a velocity JUMP — the
 * arrow visibly kicks on every notch. A second-order follower has continuous
 * velocity, so the arrow, the robot journey, the section reveals and the
 * section-3 phases all glide through one continuous, shared clock.
 * SMOOTH_OMEGA is the natural frequency (rad/s): higher = tighter tracking.
 */
const SMOOTH_OMEGA = 12

export default function SimplePage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const pinWrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pathARef = useRef<SVGPathElement>(null)
  const arrowARef = useRef<HTMLDivElement>(null)
  const pathBRef = useRef<SVGPathElement>(null)
  const arrowBRef = useRef<HTMLDivElement>(null)
  const trailBRef = useRef<HTMLDivElement>(null)
  const robotBoxRef = useRef<HTMLDivElement>(null)
  const trailGeom = useRef<TrailGeom | null>(null)
  const geom = useRef({
    heroH: 0,
    secH: 0,
    pinStart: 0,
    total: 0,
    Lb: 0,
    switchY: 0,
    enterEnd: 1,
    headEnd: 2,
    spinEnd: 3,
    endEnd: 4,
    pinPx: 100,
  })
  const [progress, setProgress] = useState(0)
  const [roll, setRoll] = useState(0)
  const [third, setThird] = useState({ q1: 0, q2: 0, qSpin: 0, qEnd: 0 })
  // the build open in the project sheet (null = closed)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const openProject = useCallback((i: number) => setOpenIdx(i), [])
  const closeProject = useCallback(() => setOpenIdx(null), [])
  // the Websites card: down to the projects window, opened
  const goProjects = () => {
    const G = geom.current
    window.scrollTo({ top: Math.round(G.pinStart + G.enterEnd), behavior: 'smooth' })
  }
  const progressRef = useRef(0)
  // smoothed scroll scalar (fraction of the whole page) — the single shared
  // input for the trail, the arrow, the robot journey and section 3 — and
  // its velocity (the follower is second-order)
  const smoothRef = useRef(0)
  const smoothVelRef = useRef(0)
  // The page mounts UNDER the loading screen (which covers it completely
  // and locks scrolling), so the 3D robot's canvas is already up and draws
  // its first frame while the loader is still showing — the loader holds
  // for that frame, and the robot is standing there, complete, at reveal.
  const [loaderGone, setLoaderGone] = useState(false)
  const [robotReady, setRobotReady] = useState(false)

  // trail part A (over the hero) + part B (over the frozen section 2) — both
  // derived from the same smoothed value, written directly to the DOM.
  const applyARef = useRef<(drawn: number) => void>(() => {})
  const lastA = useRef(-1)
  applyARef.current = (drawn) => {
    const g = trailGeom.current
    const arrow = arrowARef.current
    const path = pathARef.current
    if (!g || !arrow) return
    const reveal = Math.max(0, Math.min(g.Lb, drawn - TRAIL_LAG))
    if (path && Math.abs(reveal - lastA.current) > 0.05) {
      lastA.current = reveal
      path.setAttribute('d', trailD(g, 0, reveal, g.strA, 0))
    }
    const { x, y, ang } = pointAt(g, drawn)
    // arrow fades in from behind the robot, then hands over to part B at the
    // hero/section boundary
    let op = drawn <= 0.02 * g.total ? 0 : Math.min(1, (drawn - 0.02 * g.total) / (0.08 * g.total))
    if (drawn >= g.Lb) op = 0
    arrow.style.opacity = op.toFixed(3)
    const grow = 0.9 + 0.1 * Math.min(1, (drawn / g.total) * 20)
    arrow.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${ang.toFixed(2)}deg) scale(${grow.toFixed(3)})`
  }

  const applyBRef = useRef<(pA: number, drawn: number) => void>(() => {})
  const lastB = useRef(-1)
  applyBRef.current = (pA, drawn) => {
    const g = trailGeom.current
    const hero = heroRef.current
    const arrow = arrowBRef.current
    const path = pathBRef.current
    if (!g || !arrow || !hero) return
    const heroH = hero.offsetHeight
    const reveal = Math.max(g.Lb, Math.min(g.total, drawn - TRAIL_LAG))
    if (path && Math.abs(reveal - lastB.current) > 0.05) {
      lastB.current = reveal
      path.setAttribute('d', trailD(g, g.Lb, reveal, g.strB, heroH))
    }
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
          smoothVelRef.current = 0
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
    const build = () => {
      const hero = heroRef.current
      const sec = secondRef.current
      const pathA = pathARef.current
      const pathB = pathBRef.current
      if (!hero || !sec || !pathA || !pathB) return
      const w = window.innerWidth
      const h = window.innerHeight
      const heroH = hero.offsetHeight
      const secH = sec.offsetHeight
      const g = buildTrail(w, heroH)
      trailGeom.current = g
      lastA.current = -1
      lastB.current = -1
      // part B starts mid-pattern so its dots continue part A's rhythm
      // seamlessly across the boundary
      pathB.style.strokeDashoffset = (g.Lb % DASH_PERIOD).toFixed(2)

      const budget = pinBudget(w, h)
      geom.current = {
        heroH,
        secH,
        // the pin starts where section 2 has scrolled fully away
        pinStart: heroH + secH,
        total: g.total,
        Lb: g.Lb,
        switchY: g.switchY,
        enterEnd: budget.enterEnd,
        headEnd: budget.headEnd,
        spinEnd: budget.spinEnd,
        endEnd: budget.endEnd,
        pinPx: budget.pinPx,
      }
      // the pin wrapper = the sticky stage (one viewport) + its scroll
      // budget — both on whole pixels: a fractional edge between the stage
      // and the next section lets a hairline of the page background through
      // at the pin end
      requestAnimationFrame(() => {
        const wrap = pinWrapRef.current
        const stage = stageRef.current
        if (!wrap || !stage) return
        const stageH = Math.ceil(stage.getBoundingClientRect().height)
        stage.style.height = stageH + 'px'
        wrap.style.height = Math.round(stageH + budget.pinPx) + 'px'
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
  }, [])

  /**
   * Master scroll loop — robot + trail + section 2's wheel + section 3.
   *
   *   · the hero stands with the robot on the right, facing the viewer (the
   *     trail emerges behind it)
   *   · on the way down the robot stays put in the hero, in parallax: it
   *     rises at a fraction of the scroll speed (depth) and turns a little
   *     toward the type; when the hero's bottom edge catches up with it, it
   *     rides out of the top with the hero — gone exactly as section 2
   *     arrives (and back the same way). It is NEVER scaled down.
   *   · section 2 scrolls like any section; its wheel rolls with the scroll.
   *     Section 3 follows and pins; the projects window rises.
   *
   * Smoothness: scroll arrives in steps (wheel notches). One critically-
   * damped follower (SMOOTH_OMEGA) turns it into a scalar with continuous
   * velocity, and the trail, the arrow, the robot, the section-2 reveals
   * and the section-3 phases all derive from that SAME scalar — one shared
   * clock.
   */
  useEffect(() => {
    const box = robotBoxRef.current
    if (!box) return
    let raf = 0
    let last = performance.now()
    let lastPA = 0
    let lastRoll = 0
    let lastThird = { q1: -1, q2: -1, qSpin: -1, qEnd: -1 }

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

      // advance the shared smoothed scalar toward the raw scroll fraction:
      // critically-damped spring, integrated in small sub-steps so it is
      // stable and frame-rate independent
      const raw = progressRef.current
      {
        let x = smoothRef.current
        let v = smoothVelRef.current
        const n = Math.max(1, Math.ceil(dt / 0.004))
        const hdt = dt / n
        for (let k = 0; k < n; k++) {
          const acc = SMOOTH_OMEGA * SMOOTH_OMEGA * (raw - x) - 2 * SMOOTH_OMEGA * v
          v += acc * hdt
          x += v * hdt
        }
        if (Math.abs(raw - x) < 1e-6 && Math.abs(v) < 1e-5) {
          x = raw
          v = 0
        }
        smoothRef.current = x
        smoothVelRef.current = v
      }
      const sp = smoothRef.current
      const px = sp * maxScroll

      // hero → section 2 scroll drives the trail, the robot and the
      // section-2 reveals — all of it completes when section 2 is fully in
      // view; section 3's pin starts where section 2 has scrolled away
      const pA = Math.max(0, Math.min(1, px / Math.max(1, G.heroH)))
      const pinLocal = Math.max(0, px - G.pinStart)

      // section 3 phases (linear in scroll; SimpleThird eases them)
      const q1 = clamp01(pinLocal / G.enterEnd)
      const q2 = clamp01((pinLocal - G.enterEnd) / Math.max(1, G.headEnd - G.enterEnd))
      const qSpin = clamp01((pinLocal - G.headEnd) / Math.max(1, G.spinEnd - G.headEnd))
      const qEnd = clamp01((pinLocal - G.spinEnd) / Math.max(1, G.endEnd - G.spinEnd))

      // the robot: on the right of the hero (desktop) / under the type
      // (phones), in parallax — it rises at a fraction of the scroll speed,
      // and when the hero's bottom edge catches up with it, it rides out of
      // the top with the hero
      const hx = desk ? w * 0.74 : w * 0.5
      const hy = desk ? h * 0.48 : h * 0.71
      const robotHalfH = box.offsetHeight / 2
      const parallaxY = hy - px * 0.35
      const edgeY = G.heroH - px - robotHalfH - 12
      const ty = Math.min(parallaxY, edgeY)
      const baseY = desk ? h * 0.48 : h * 0.5
      box.style.transform = `translate(-50%, -50%) translate(${(hx - w / 2).toFixed(1)}px, ${(ty - baseY).toFixed(1)}px)`

      // section 2's wheel: rolls from the moment the cards come up into
      // view until the section has scrolled away
      const rollFrom = G.heroH - h * 0.55
      const roll = clamp01((px - rollFrom) / Math.max(1, G.pinStart - rollFrom))

      // trail + arrow derive from the same scalar — synced by construction
      const drawn = pA * G.total
      applyARef.current(drawn)
      applyBRef.current(pA, drawn)

      if (Math.abs(pA - lastPA) > 0.0004) {
        lastPA = pA
        setProgress(pA)
      }
      if (Math.abs(roll - lastRoll) > 0.0006) {
        lastRoll = roll
        setRoll(roll)
      }
      if (
        Math.abs(q1 - lastThird.q1) > 0.0008 ||
        Math.abs(q2 - lastThird.q2) > 0.0008 ||
        Math.abs(qSpin - lastThird.qSpin) > 0.0004 ||
        Math.abs(qEnd - lastThird.qEnd) > 0.0008
      ) {
        lastThird = { q1, q2, qSpin, qEnd }
        setThird({ q1, q2, qSpin, qEnd })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const arrowSvg = (
    <svg width="46" height="46" viewBox="0 0 32 32" fill="none" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.32)]">
      <path d="M28.2 4.2L4.1 14.6l8.4 4.7 3.7 9.1 12-24.2z" fill="currentColor" />
    </svg>
  )

  return (
    <div ref={wrapperRef} className="relative min-h-screen bg-cream">
      {/* the loading screen downloads the 3D robot (real progress on the bar)
          and then also waits for its first rendered frame, so the robot is
          standing there, complete, the moment the page is revealed */}
      {!loaderGone && (
        <Loader
          onReveal={() => {}}
          onGone={() => setLoaderGone(true)}
          preload={preloadRobot}
          waitFor={() => robotReady}
        />
      )}

      <>
        <MemoHeader />
        {/* same hanging robot + rope as the main page (rides the right edge) */}
        <MemoRope />

        {/* ——— hero (in normal flow) + trail part A over it ——— */}
        <div className="relative">
          <div ref={heroRef}>
            <MemoHero revealed={loaderGone} />
          </div>
          {/* own compositor layer: the trail repaints every frame while the
              arrow travels, and must not drag the hero's blurred glows into
              that repaint */}
          <div className="pointer-events-none absolute inset-0 z-[5]" style={{ willChange: 'transform' }} aria-hidden>
            <svg className="absolute inset-0 block h-full w-full">
              {/* the trail exists exactly as far as the arrow has travelled */}
              <path
                ref={pathARef}
                d=""
                fill="none"
                stroke="#111111"
                strokeOpacity="0.22"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray={DASH}
              />
            </svg>
            <div ref={arrowARef} className="absolute left-0 top-0 text-ink will-change-transform" style={{ opacity: 0 }}>
              {arrowSvg}
            </div>
          </div>
        </div>

        {/* robot — viewport-fixed, doc-anchored: on the right of the hero
            (under the type on phones), in parallax, leaving with the hero */}
        <div className="pointer-events-none fixed inset-0 z-[6]">
          <div
            ref={robotBoxRef}
            className="absolute left-1/2 top-[50%] h-[min(52vh,440px)] w-[min(80vw,340px)] will-change-transform lg:top-[48%] lg:h-[min(76vh,680px)] lg:w-[min(40vw,520px)]"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <Robot3D scrollProgress={progress} onReady={() => setRobotReady(true)} />
          </div>
        </div>

        {/* ——— section 2 (in normal flow) + trail part B ——— */}
        <div ref={secondRef} className="relative z-[1]">
          <SimpleSecond progress={progress} roll={roll} onProjects={goProjects} />
          <div
                ref={trailBRef}
                className="pointer-events-none absolute inset-0 z-[5]"
                style={{ willChange: 'transform' }}
                aria-hidden
              >
                <svg className="absolute inset-0 block h-full w-full">
                  <path
                    ref={pathBRef}
                    d=""
                    fill="none"
                    stroke="#111111"
                    strokeOpacity="0.22"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeDasharray={DASH}
                  />
                </svg>
                <div ref={arrowBRef} className="absolute left-0 top-0 text-ink will-change-transform" style={{ opacity: 0 }}>
                  {arrowSvg}
                </div>
              </div>
            </div>

        {/* ——— the pin: section 3 arrives and holds while it plays ——— */}
        <div ref={pinWrapRef} id="projects" className="relative">
          <div ref={stageRef} className="sticky top-0 z-0 h-[100svh] overflow-hidden" style={{ backgroundColor: THIRD_BG }}>
            {/* section 3 — the desktop, the window, the heading, the ring's turn, the closing line */}
            <MemoThird q1={third.q1} q2={third.q2} qSpin={third.qSpin} qEnd={third.qEnd} onOpen={openProject} />
          </div>
        </div>

        {/* ——— let's talk — in normal flow after the pin ——— */}
        <MemoTalk />

        {/* same footer as the main page */}
        <MemoFooter />

        {/* the project sheet: a build from the ring, opened */}
        <ProjectSheet project={openIdx === null ? null : PROJECTS[openIdx]} index={openIdx ?? 0} onClose={closeProject} />
      </>
    </div>
  )
}
