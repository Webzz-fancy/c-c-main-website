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

// the journey loop updates React state every frame while the page scrolls;
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
 * The dotted trail — from the project.mp4 reference:
 *
 *   There is NO pre-existing dotted path on the page. The line draws itself
 *   with the scroll: wherever the scroll has already reached, the dotted
 *   trail exists — nothing after it.
 *
 * One smooth wave in pixel space from behind the robot to the start of
 * section 2. Each frame the dotted path is emitted from the start exactly as
 * far as the scroll has drawn it (a thin-stroke repaint — no mask surfaces).
 *
 * The trail is split in two: part A rides the hero, part B rides section 2
 * (both in normal flow). They hand over exactly at the hero/section
 * boundary — the line is pixel-identical on both sides of it.
 */

// The travel path, in pixel space, laid out on the measured hero: a dotted
// line that draws itself with the scroll, from behind the robot down through
// the hero to the start of section 2, as one smooth wave — every joint is
// tangent-continuous (the handle on each side of a joint is the mirror of
// the other), so there is no corner anywhere along it.
type Vec2 = [number, number]
type Seg = [Vec2, Vec2, Vec2, Vec2]
function pathSegs(w: number, H: number): Seg[] {
  const desk = w >= 1024
  // the wave's spine: the points it passes through, top to bottom, and the
  // horizontal swing (the amplitude) at each
  const x0 = desk ? 0.74 * w : 0.5 * w
  const pts: Vec2[] = desk
    ? [
        [x0, 0.56 * H],
        [0.6 * w, 0.72 * H],
        [0.44 * w, 0.86 * H],
        [0.3 * w, H],
        [0.2 * w, H + 90],
      ]
    : [
        [x0, 0.86 * H],
        [0.36 * w, 0.95 * H],
        [0.2 * w, H + 48],
        [0.14 * w, H + 110],
      ]
  // Catmull-Rom → cubic Béziers: smooth through every point by construction
  const segs: Seg[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const k = 1 / 6
    segs.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k],
      [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k],
      p2,
    ])
  }
  // the wave: a sideways sway added on top of the spine, so the line reads
  // as a wave rather than a bend — applied by displacing the control points
  // and the joints together (the tangents stay continuous)
  // (zero at the start, so the line sets off exactly behind the robot)
  const amp = desk ? 0.05 * w : 0.07 * w
  const total = pts[pts.length - 1][1] - pts[0][1]
  const sway = (y: number) => Math.sin(((y - pts[0][1]) / total) * Math.PI * 2) * amp
  return segs.map((seg) => seg.map(([x, y]) => [x + sway(y), y] as Vec2) as Seg)
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

type TrailGeom = {
  pts: Vec2[]
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
  for (let s = 0; s < segs.length; s++) {
    const [p0, c1, c2, p1] = segs[s]
    // joint points are shared between segments — emit them once
    const start = s === 0 ? 0 : 1
    for (let i = start; i <= STEPS; i++) pts.push(cubicAt(p0, c1, c2, p1, i / STEPS))
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
  return { pts, cum, total: cum[cum.length - 1], strA, strB, Lb, switchY }
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

const DASH = '12 11' // the trail's dot pattern (period 23px)
const DASH_PERIOD = 23

/**
 * The shared smoothed scroll scalar is a critically-damped second-order
 * follower of the raw scroll. Scroll arrives in steps (wheel notches); a
 * plain exponential follower turns each step into a velocity JUMP — the
 * line visibly kicks on every notch. A second-order follower has continuous
 * velocity, so the trail, the robot, the section reveals and the
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
  const pathBRef = useRef<SVGPathElement>(null)
  const trailBRef = useRef<HTMLDivElement>(null)
  const robotBoxRef = useRef<HTMLDivElement>(null)
  const trailGeom = useRef<TrailGeom | null>(null)
  const geom = useRef({
    heroH: 0,
    secH: 0,
    /** section 2's card row: its top in the document and its height */
    cardsTop: 0,
    cardsH: 1,
    pinStart: 0,
    total: 0,
    Lb: 0,
    switchY: 0,
    enterLead: 0,
    enterEnd: 1,
    headEnd: 2,
    spinEnd: 3,
    endEnd: 4,
    pinPx: 100,
  })
  const [progress, setProgress] = useState(0)
  const [reveal, setReveal] = useState(0)
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
  // input for the trail, the robot, the section reveals and section 3 — and
  // its velocity (the follower is second-order)
  const smoothRef = useRef(0)
  const smoothVelRef = useRef(0)
  // The page mounts UNDER the loading screen (which covers it completely
  // and locks scrolling), so the 3D robot's canvas is already up and draws
  // its first frame while the loader is still showing — the loader holds
  // for that frame, and the robot is standing there, complete, at reveal.
  const [loaderGone, setLoaderGone] = useState(false)
  const [robotReady, setRobotReady] = useState(false)

  // trail part A (over the hero) + part B (over section 2) — both derived
  // from the same smoothed value, written directly to the DOM: the dotted
  // line exists exactly as far as it has been drawn
  const applyARef = useRef<(drawn: number) => void>(() => {})
  const lastA = useRef(-1)
  applyARef.current = (drawn) => {
    const g = trailGeom.current
    const path = pathARef.current
    if (!g || !path) return
    const reveal = Math.max(0, Math.min(g.Lb, drawn))
    if (Math.abs(reveal - lastA.current) > 0.05) {
      lastA.current = reveal
      path.setAttribute('d', trailD(g, 0, reveal, g.strA, 0))
    }
  }

  const applyBRef = useRef<(drawn: number) => void>(() => {})
  const lastB = useRef(-1)
  applyBRef.current = (drawn) => {
    const g = trailGeom.current
    const hero = heroRef.current
    const path = pathBRef.current
    if (!g || !path || !hero) return
    const heroH = hero.offsetHeight
    const reveal = Math.max(g.Lb, Math.min(g.total, drawn))
    if (Math.abs(reveal - lastB.current) > 0.05) {
      lastB.current = reveal
      path.setAttribute('d', trailD(g, g.Lb, reveal, g.strB, heroH))
    }
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
      const cards = sec.querySelector<HTMLElement>('[data-cards]')
      const cardsRect = cards?.getBoundingClientRect()
      const cardsTop = cardsRect ? cardsRect.top + window.scrollY : heroH + secH * 0.5
      const cardsH = cardsRect ? Math.max(1, cardsRect.height) : 1
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
        cardsTop,
        cardsH,
        // the pin starts where section 2 has scrolled fully away
        pinStart: heroH + secH,
        total: g.total,
        Lb: g.Lb,
        switchY: g.switchY,
        enterLead: budget.enterLead,
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
      applyBRef.current(0)
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
   * Master scroll loop — robot + trail + section 2's reveal + section 3.
   *
   *   · the hero stands with the robot on the right, facing the viewer (the
   *     trail emerges behind it)
   *   · on the way down the robot stays put in the hero, in parallax: it
   *     rises at a fraction of the scroll speed (depth) and turns a little
   *     toward the type; when the hero's bottom edge catches up with it, it
   *     rides out of the top with the hero — gone exactly as section 2
   *     arrives (and back the same way). It is NEVER scaled down.
   *   · section 2 scrolls like any section; its cards reveal with the scroll.
   *     Section 3 follows and pins; the projects window rises.
   *
   * Smoothness: scroll arrives in steps (wheel notches). One critically-
   * damped follower (SMOOTH_OMEGA) turns it into a scalar with continuous
   * velocity, and the trail, the robot, the section-2 reveals
   * and the section-3 phases all derive from that SAME scalar — one shared
   * clock.
   */
  useEffect(() => {
    const box = robotBoxRef.current
    if (!box) return
    let raf = 0
    let last = performance.now()
    let lastPA = 0
    let lastReveal = 0
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

      // section 3 phases (linear in scroll; SimpleThird eases them) — the
      // window's entrance starts before the pin, while the orange desktop is
      // still coming up the screen, so the two arrive together
      const q1 = clamp01((px - (G.pinStart - G.enterLead)) / Math.max(1, G.enterLead + G.enterEnd))
      const q2 = clamp01((pinLocal - G.enterEnd) / Math.max(1, G.headEnd - G.enterEnd))
      const qSpin = clamp01((pinLocal - G.headEnd) / Math.max(1, G.spinEnd - G.headEnd))
      const qEnd = clamp01((pinLocal - G.spinEnd) / Math.max(1, G.endEnd - G.spinEnd))

      // the robot: on the right of the hero (desktop) / under the type
      // (phones), in parallax — it rises at a fraction of the scroll speed,
      // and when the hero's bottom edge catches up with it, it rides out of
      // the top with the hero
      const hx = desk ? w * 0.72 : w * 0.5
      const hy = desk ? h * 0.5 : h * 0.71
      const robotHalfH = box.offsetHeight / 2
      const parallaxY = hy - px * 0.35
      const edgeY = G.heroH - px - robotHalfH - 12
      const ty = Math.min(parallaxY, edgeY)
      const baseY = desk ? h * 0.48 : h * 0.5
      box.style.transform = `translate(-50%, -50%) translate(${(hx - w / 2).toFixed(1)}px, ${(ty - baseY).toFixed(1)}px)`

      // section 2's cards: they reveal with the scroll from the moment the
      // row comes up over the bottom of the screen, and stand complete when
      // the row reaches the middle of the screen (the line draws with it)
      const revealFrom = G.cardsTop - h * 0.96
      const revealTo = G.cardsTop + G.cardsH / 2 - h / 2
      const reveal = clamp01((px - revealFrom) / Math.max(1, revealTo - revealFrom))

      // the trail draws with the same scalar: complete as section 2 arrives
      const drawn = pA * G.total
      applyARef.current(drawn)
      applyBRef.current(drawn)

      if (Math.abs(pA - lastPA) > 0.0004) {
        lastPA = pA
        setProgress(pA)
      }
      if (Math.abs(reveal - lastReveal) > 0.0006) {
        lastReveal = reveal
        setReveal(reveal)
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
              line draws, and must not drag the hero's blurred glows into
              that repaint */}
          <div className="pointer-events-none absolute inset-0 z-[5]" style={{ willChange: 'transform' }} aria-hidden>
            <svg className="absolute inset-0 block h-full w-full">
              {/* the trail exists exactly as far as it has been drawn */}
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
          <SimpleSecond progress={progress} reveal={reveal} onProjects={goProjects} />
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
