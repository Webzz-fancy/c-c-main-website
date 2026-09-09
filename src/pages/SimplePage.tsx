import { memo, useEffect, useRef, useState } from 'react'
import SimpleHero from '../components/simple/SimpleHero'
import SimpleSecond from '../components/simple/SimpleSecond'
import SimpleThird from '../components/simple/SimpleThird'
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
import { handoff } from '../components/simple/journey'

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
  /** document-y where cream ends and the blue plane begins (the hero's
   *  straight bottom edge): the trail and the arrow switch colour there */
  switchY: number
}

function buildTrail(areaW: number, areaH: number, heroH: number): TrailGeom {
  const segs = PATH_SEGS.map(([p0, c1, c2, p1]) => [
    [p0[0] * areaW, p0[1] * areaH],
    [c1[0] * areaW, c1[1] * areaH],
    [c2[0] * areaW, c2[1] * areaH],
    [p1[0] * areaW, p1[1] * areaH],
  ] as [Vec2, Vec2, Vec2, Vec2])

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

  // the hero ends on a straight edge: cream above y = heroH, blue below
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
  const gradARef = useRef<SVGLinearGradientElement>(null)
  const aStop1 = useRef<SVGStopElement>(null)
  const aStop2 = useRef<SVGStopElement>(null)
  const aStop3 = useRef<SVGStopElement>(null)
  const aStop4 = useRef<SVGStopElement>(null)
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
  const [third, setThird] = useState({ q1: 0, q2: 0, qSpin: 0, qEnd: 0 })
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
    arrow.style.color = y < g.switchY ? '#1B1A17' : '#FFFFFF'
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
    arrow.style.color = '#FFFFFF'
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
      const areaH = heroH + secH
      const g = buildTrail(w, areaH, heroH)
      trailGeom.current = g
      lastA.current = -1
      lastB.current = -1
      // part B starts mid-pattern so its dots continue part A's rhythm
      // seamlessly across the boundary
      pathB.style.strokeDashoffset = (g.Lb % DASH_PERIOD).toFixed(2)
      // part A gradient: ink → white across the hero's bottom edge
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
      pathB.setAttribute('stroke', '#FFFFFF')

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
   * Master scroll loop — robot journey + trail + section 3.
   *
   *   · the hero stands with the robot centred, facing the viewer (the trail
   *     emerges behind it)
   *   · on the way down the robot glides to its perch in the UPPER-RIGHT
   *     of the second section (the empty right column), turned 45° LEFT —
   *     a horizontal turn, it stays perfectly upright — so it faces the
   *     content on the left. It is NEVER scaled down. The glide is a single
   *     monotonic move in viewport space (up and to the right, one gentle
   *     arc): the robot settles where the perch will be and the section
   *     rises to meet it, so there is no dip-and-recover and nothing to
   *     flinch — by the time section 2 is fully in view, robot and perch
   *     coincide exactly.
   *   · section 2 then scrolls away like any section, and the robot leaves
   *     with it (it is anchored to its perch in the section). Section 3
   *     follows under a plane of fog and pins; the fog clears from below
   *     and the projects window opens.
   *
   * Smoothness: scroll arrives in steps (wheel notches). One critically-
   * damped follower (SMOOTH_OMEGA) turns it into a scalar with continuous
   * velocity, and the trail, the arrow, the robot pose, the section-2
   * reveals and the section-3 phases all derive from that SAME scalar — one
   * shared clock.
   */
  useEffect(() => {
    const box = robotBoxRef.current
    if (!box) return
    let raf = 0
    let last = performance.now()
    let lastPA = 0
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
      const s = handoff(pA)
      const pinLocal = Math.max(0, px - G.pinStart)

      // section 3 phases (linear in scroll; SimpleThird eases them)
      const q1 = clamp01(pinLocal / G.enterEnd)
      const q2 = clamp01((pinLocal - G.enterEnd) / Math.max(1, G.headEnd - G.enterEnd))
      const qSpin = clamp01((pinLocal - G.headEnd) / Math.max(1, G.spinEnd - G.headEnd))
      const qEnd = clamp01((pinLocal - G.spinEnd) / Math.max(1, G.endEnd - G.spinEnd))

      // hero anchor (viewport px) — where the robot stands at rest
      const hx = w * 0.5
      const hy = h * (desk ? 0.48 : 0.5)

      let tx: number, ty: number, to: number
      if (desk) {
        // perch: centre of the empty right column of section 2, in
        // viewport px once the section is fully in view (the pin start).
        // Stays full size — no shrinking, at all.
        const prx = w * 0.773
        const pry = 0.42 * G.secH
        tx = hx + (prx - hx) * s
        // doc-anchored to the perch: once section 2 is fully in view the
        // robot scrolls away with it (and comes back with it)
        const perchOff = Math.min(0, G.heroH - px)
        ty = hy + (pry + perchOff - hy) * s
        to = 1
      } else {
        // mobile: content is full-width, so no perch — the robot stays
        // centred, in parallax, for the whole of the hero: it rises at a
        // fraction of the scroll speed (depth), and when the hero's bottom
        // edge catches up with it, it rides out of the top with the hero,
        // so it is gone exactly as section 2 arrives (and comes back the
        // same way)
        const robotHalfH = box.offsetHeight / 2
        const parallaxY = hy - px * 0.35
        const edgeY = G.heroH - px - robotHalfH - 12
        tx = hx
        ty = Math.min(parallaxY, edgeY)
        to = 1
      }
      // a gentle upward arc through the handoff (zero at both ends), so the
      // glide reads as an organic flit rather than a straight diagonal
      const arc = desk ? 40 * Math.sin(Math.PI * s) : 0
      const baseY = desk ? h * 0.48 : h * 0.5
      box.style.transform =
        `translate(-50%, -50%) translate(${(tx - w / 2).toFixed(1)}px, ${(ty - baseY - arc).toFixed(1)}px)`
      box.style.opacity = to.toFixed(3)

      // trail + arrow derive from the same scalar — synced by construction
      const drawn = pA * G.total
      applyARef.current(drawn)
      applyBRef.current(pA, drawn)

      if (Math.abs(pA - lastPA) > 0.0004) {
        lastPA = pA
        setProgress(pA)
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
              <defs>
                <linearGradient id="cc-trail-grad-a" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100" ref={gradARef}>
                  <stop ref={aStop1} offset="0" stopColor="#111111" stopOpacity="0.22" />
                  <stop ref={aStop2} offset="0.5" stopColor="#111111" stopOpacity="0.22" />
                  <stop ref={aStop3} offset="0.5" stopColor="#FFFFFF" stopOpacity="0.88" />
                  <stop ref={aStop4} offset="1" stopColor="#FFFFFF" stopOpacity="0.88" />
                </linearGradient>
              </defs>
              {/* the trail exists exactly as far as the arrow has travelled */}
              <path
                ref={pathARef}
                d=""
                fill="none"
                stroke="url(#cc-trail-grad-a)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray={DASH}
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

        {/* robot — viewport-fixed, doc-anchored: centred in the hero, then
            on its perch in section 2, with which it scrolls away */}
        <div className="pointer-events-none fixed inset-0 z-[6]">
          <div
            ref={robotBoxRef}
            className="absolute left-1/2 top-[50%] h-[min(60vh,520px)] w-[min(86vw,360px)] will-change-transform lg:top-[48%] lg:h-[min(76vh,680px)] lg:w-[min(40vw,520px)]"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <Robot3D scrollProgress={progress} onReady={() => setRobotReady(true)} />
          </div>
        </div>

        {/* ——— section 2 (in normal flow) + trail part B ——— */}
        <div ref={secondRef} className="relative z-[1]">
          <SimpleSecond progress={progress} />
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
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeDasharray={DASH}
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

        {/* ——— the pin: section 3 arrives under the fog and holds while it plays ——— */}
        <div ref={pinWrapRef} className="relative">
          <div ref={stageRef} className="sticky top-0 z-0 h-[100svh] overflow-hidden bg-cream">
            {/* section 3 — the fog clears, the desktop, the window, the heading, the ring's turn, the closing line */}
            <MemoThird q1={third.q1} q2={third.q2} qSpin={third.qSpin} qEnd={third.qEnd} />
          </div>
        </div>

        {/* ——— let's talk — in normal flow after the pin ——— */}
        <MemoTalk />

        {/* same footer as the main page */}
        <MemoFooter />
      </>
    </div>
  )
}
