import { useCallback, useEffect, useRef, useState } from 'react'
import { site } from '../../config/site'

/**
 * Let's talk — the contact section (the Neutomni "Ready to get your business
 * in shape?" block, on our cream, in our brand colour).
 *
 * The picture: the heading and a short paragraph, centred; below them one
 * dashed brand rule runs the full width of the screen with five thin
 * outline shapes standing on it — a diamond, a pentagon, a hexagon, an
 * octagon and a circle — and the solid brand shape, "[ LET'S TALK ]", over
 * the first of them.
 *
 * The interaction: the shape follows the mouse along the rule — no
 * dragging: wherever the pointer is over the band around the rule, the
 * shape glides to that x (never off the line, never up or down). As it
 * travels it turns, and takes the form of each outline it passes — square
 * to hexagon to heptagon to octagon to circle: the business getting in
 * shape. When the pointer leaves the band the shape settles on the nearest
 * station. Its form, its turn and its place are all one function of where
 * it is on the rule, so it can never be in an in-between state that doesn't
 * make sense, and it runs backwards just as well. A click opens the booking
 * link; so does the keyboard (arrows step it along, Enter opens it). On
 * touch screens (no hover) a finger sliding along the band moves it.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)

/** the five stations on the rule, as in the reference: sides of the
 *  outline standing there (0 = circle) and its rotation (deg, a corner at
 *  that angle; screen angles, so −90 is a corner at the top). The square
 *  stands on a corner — a diamond; the hexagon and heptagon point up; the
 *  octagon sits flat. */
const STATIONS: { sides: number; rot: number }[] = [
  { sides: 4, rot: 0 },
  { sides: 6, rot: -90 },
  { sides: 7, rot: -90 },
  { sides: 8, rot: 22.5 },
  { sides: 0, rot: 0 },
]
/** the shape starts as a square sitting a little askew on the diamond (as
 *  the reference's does) — a corner at 45° is a square; the −12° is the
 *  slouch — and its type slouches with it, coming upright as it travels */
const START_TILT = 45 - 12
const TYPE_TILT = -12
/** the stations' centres at rest, as a share of the rule's width — the
 *  first one sits well inside the left edge so the shape starts clear of
 *  it; the row drifts left as the shape travels right (as in the
 *  reference), so the shape passes a station every quarter of its travel
 *  and ends exactly over the circle */
function stations(vw: number) {
  const desk = vw >= 1024
  const first = desk ? 0.12 : 0.2
  const last = desk ? 0.92 : 1.02
  const step = (last - first) / 4
  const x = [0, 1, 2, 3, 4].map((i) => first + i * step)
  const drift = desk ? 0.1 : 0.3
  return { x, drift, span: last - first - drift }
}

/** how many samples the morphing shape is drawn with */
const SAMPLES = 96

/**
 * radius of a regular n-gon (circumradius 1) along the ray at polar angle
 * `t` (rad) in the polygon's own frame (a corner at angle 0); a circle for
 * n = 0. The ray meets the nearest edge at apothem / cos(offset from the
 * apothem's direction), the apothem being cos(π/n).
 */
function ngonRadius(n: number, t: number) {
  if (n === 0) return 1
  const step = (2 * Math.PI) / n
  const half = step / 2
  const k = Math.round(t / step) // nearest corner
  const d = Math.abs(t - k * step) // 0 … half, away from that corner
  return Math.cos(half) / Math.cos(half - d)
}

/** a clip-path polygon() for the shape between two stations */
function morphPath(from: { sides: number; rot: number }, to: { sides: number; rot: number }, t: number) {
  const pts: string[] = []
  const e = smooth(clamp01(t))
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i / SAMPLES) * 2 * Math.PI
    const ra = ngonRadius(from.sides, a - (from.rot * Math.PI) / 180)
    const rb = ngonRadius(to.sides, a - (to.rot * Math.PI) / 180)
    const r = lerp(ra, rb, e) * 50
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`)
  }
  return `polygon(${pts.join(',')})`
}

/** SVG points of a regular n-gon in a 100 × 100 box (circumradius r) */
function ngonPoints(n: number, rot: number, r = 49.5) {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = ((rot + (i * 360) / n) * Math.PI) / 180
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export default function SimpleTalk() {
  const sectionRef = useRef<HTMLElement>(null)
  const ruleRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  // is the pointer over the shape itself (a click there opens the link)
  const [overShape, setOverShape] = useState(false)

  // in-view reveal (one shot): the type rises out of a blur, the rule and
  // its outlines arrive, the shape pops onto the first station
  const [shown, setShown] = useState(false)
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const { x: STATION_X, drift: DRIFT, span: SPAN } = stations(vw)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // the shape's place on the rule: 0 = over the first station, 1 = the last
  const [p, setP] = useState(0)
  const pRef = useRef(0)
  const [touched, setTouched] = useState(false)
  // the follow: the pointer's target on the rule (null = pointer not over
  // the band) and the follower loop that glides the shape to it
  const target = useRef<number | null>(null)
  const follow = useRef(0)
  const velocity = useRef(0)
  const lastT = useRef(0)
  const inertia = useRef(0)

  const setPos = useCallback((v: number) => {
    const c = clamp01(v)
    pRef.current = c
    setP(c)
  }, [])

  /** the pointer's x → its place on the rule (0 … 1, clamped) */
  const placeAt = (clientX: number) => {
    const rule = ruleRef.current
    if (!rule) return 0
    const r = rule.getBoundingClientRect()
    const st = stations(window.innerWidth)
    // the shape's centre is at (first + p·span) of the rule; the row of
    // outlines drifts by −p·drift — the pointer is over the shape's own x
    return clamp01((clientX - r.left) / r.width - st.x[0]) / st.span
  }

  const stopInertia = () => {
    if (inertia.current) cancelAnimationFrame(inertia.current)
    inertia.current = 0
  }
  const stopFollow = () => {
    if (follow.current) cancelAnimationFrame(follow.current)
    follow.current = 0
  }

  /** the follower: a critically damped glide towards the pointer's place,
   *  so the shape trails the mouse a touch instead of snapping to it */
  const startFollow = () => {
    if (follow.current) return
    stopInertia()
    lastT.current = performance.now()
    const omega = 22
    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT.current) / 1000))
      lastT.current = now
      const t = target.current
      if (t == null) {
        follow.current = 0
        return
      }
      // integrated in small sub-steps, so a slow frame cannot overshoot
      let x = pRef.current
      let v = velocity.current
      const n = Math.max(1, Math.ceil(dt / 0.004))
      const hdt = dt / n
      for (let k = 0; k < n; k++) {
        const acc = omega * omega * (t - x) - 2 * omega * v
        v += acc * hdt
        x += v * hdt
      }
      velocity.current = v
      const next = x
      if (Math.abs(t - next) < 0.0004 && Math.abs(velocity.current) < 0.01) {
        setPos(t)
        velocity.current = 0
      } else {
        setPos(next)
      }
      follow.current = requestAnimationFrame(step)
    }
    follow.current = requestAnimationFrame(step)
  }

  /** the pointer has left: settle on the nearest station (a critically
   *  damped approach, carrying the follow's velocity), so at rest the shape
   *  is always one of the five — never something in between */
  const settle = (to?: number) => {
    stopFollow()
    stopInertia()
    const n = STATIONS.length - 1
    const dest = to ?? clamp(Math.round(pRef.current * n) / n, 0, 1)
    let v = velocity.current
    velocity.current = 0
    let last = performance.now()
    const omega = 12 // critically damped spring, 1/s
    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      let x = pRef.current
      const n = Math.max(1, Math.ceil(dt / 0.004))
      const hdt = dt / n
      for (let k = 0; k < n; k++) {
        const acc = omega * omega * (dest - x) - 2 * omega * v
        v += acc * hdt
        x += v * hdt
      }
      const next = x
      if (Math.abs(dest - next) < 0.0005 && Math.abs(v) < 0.02) {
        setPos(dest)
        inertia.current = 0
        return
      }
      setPos(next)
      inertia.current = requestAnimationFrame(step)
    }
    inertia.current = requestAnimationFrame(step)
  }

  /** is this x over the shape (within its half width of its centre)? */
  const hitsShape = (clientX: number) => {
    const link = linkRef.current
    if (!link) return false
    const r = link.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right
  }

  /* the band around the rule: the pointer moving over it moves the shape */
  const onBandMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // a finger only moves it while it is down (so the page still scrolls
    // over the band); a mouse moves it by hovering
    if (e.pointerType !== 'mouse' && e.buttons === 0) return
    target.current = placeAt(e.clientX)
    if (!touched) setTouched(true)
    setOverShape(hitsShape(e.clientX))
    startFollow()
  }
  const onBandLeave = () => {
    target.current = null
    setOverShape(false)
    settle()
  }
  const onBandClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // the shape is a link: a click on it opens the booking page (the
    // pointer passes through the shape to the band, so the band forwards it)
    if (hitsShape(e.clientX)) linkRef.current?.click()
  }
  const onBandDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    target.current = placeAt(e.clientX)
    if (!touched) setTouched(true)
    startFollow()
  }
  const onBandUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    onBandLeave()
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      stopInertia()
      setTouched(true)
      // a step to the next station
      const n = STATIONS.length - 1
      const at = Math.round(pRef.current * n)
      target.current = null
      settle(clamp((at + (e.key === 'ArrowRight' ? 1 : -1)) / n, 0, 1))
    }
  }
  useEffect(
    () => () => {
      stopInertia()
      stopFollow()
    },
    [],
  )

  /* ---- the shape, from its place on the rule ---- */
  const seg = clamp(p * (STATIONS.length - 1), 0, STATIONS.length - 1 - 1e-6)
  const si = Math.floor(seg)
  const st = seg - si
  const clipPath = morphPath(STATIONS[si], STATIONS[si + 1], st)
  // it turns as it travels, like a wheel rolling to the right — two full
  // turns across the rule — while its type stays readable: it only keeps
  // the slouch of the first station, and loses it on the way
  const rot = lerp(START_TILT, 720, p)
  const typeRot = -rot + TYPE_TILT * (1 - p)
  const left = `${((STATION_X[0] + p * SPAN) * 100).toFixed(3)}%`
  const driftX = `${(-p * DRIFT * 100).toFixed(3)}%`

  const booking = site.links.booking
  const rise = (delay: number) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translate3d(0,0,0)' : 'translate3d(0, 60px, 0)',
    filter: shown ? 'blur(0px)' : 'blur(15px)',
    transition: `opacity 900ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1100ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 1100ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream text-ink"
      aria-labelledby="talk-heading"
    >
      <div className="grain absolute inset-0 opacity-40" aria-hidden />

      {/* the type */}
      <div className="relative mx-auto w-full max-w-[1240px] px-6 pt-[max(14svh,120px)] text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/55" style={rise(0)}>
          Contact
        </p>
        <h2 id="talk-heading" className="mt-5 text-[clamp(2.4rem,5.6vw,5.4rem)] leading-[1.0] tracking-[-0.03em]">
          <span className="block font-sans font-normal" style={rise(80)}>
            Ready to get your
          </span>
          <span className="mt-[0.06em] block font-display italic text-brand-600" style={rise(180)}>
            business found?
          </span>
        </h2>
        <p className="mx-auto mt-7 max-w-[440px] text-[15px] font-light leading-relaxed text-ink/72" style={rise(280)}>
          Treat it like a <em className="font-display italic text-ink">first conversation</em>. Thirty minutes, no obligation. We get to know your
          business, you get an honest read on what a Simple build would do for it.
        </p>
      </div>

      {/* the rule, the stations, the shape */}
      <div className="relative mt-auto w-full pb-[max(10svh,80px)] pt-[max(10svh,72px)]">
        <div
          ref={ruleRef}
          className="relative h-0 w-full"
          style={{ opacity: shown ? 1 : 0, transition: 'opacity 900ms linear 350ms' }}
        >
          {/* the dashed rule, edge to edge */}
          <div
            className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #E1AD34 0 9px, transparent 9px 17px)' }}
            aria-hidden
          />

          {/* the outlines standing on it — the row drifts left as the shape
              travels right */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-0 will-change-transform" style={{ transform: `translate3d(${driftX}, 0, 0)` }} aria-hidden>
          {STATIONS.map((s, i) => (
            <div
              key={i}
              className="absolute top-0 aspect-square w-[clamp(64px,9vw,176px)]"
              style={{
                left: `${STATION_X[i] * 100}%`,
                opacity: shown ? 1 : 0,
                transform: shown ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.6)',
                transition: `opacity 700ms ease ${420 + i * 90}ms, transform 1000ms cubic-bezier(0.16,1,0.3,1) ${420 + i * 90}ms`,
              }}
            >
              <svg viewBox="0 0 100 100" className="block h-full w-full overflow-visible">
                {s.sides === 0 ? (
                  <circle cx="50" cy="50" r="49.5" fill="none" stroke="rgba(27,26,23,0.22)" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
                ) : (
                  <polygon points={ngonPoints(s.sides, s.rot)} fill="none" stroke="rgba(27,26,23,0.22)" strokeWidth="0.9" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                )}
              </svg>
            </div>
          ))}
          </div>

          {/* the hint — sits by the shape (under it on phones) until it has
              been moved */}
          <span
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 translate-y-[clamp(56px,7vw,72px)] whitespace-nowrap font-mono text-[10px] tracking-[0.2em] text-ink/55 lg:ml-[clamp(50px,6.4vw,124px)] lg:translate-x-0 lg:-translate-y-1/2 lg:text-[11px]"
            style={{
              left: `${STATION_X[0] * 100}%`,
              opacity: shown && !touched ? 1 : 0,
              transition: touched ? 'opacity 200ms ease' : 'opacity 500ms ease 900ms',
            }}
            aria-hidden
          >
            &lt; FOLLOW ME &gt;
          </span>

          {/* the shape — a plain link that rides the band's pointer; the
              pointer passes through it to the band, so the follow never
              stutters at its own edge */}
          <a
            ref={linkRef}
            href={booking}
            aria-label="Let’s talk. Book a free call"
            className="group pointer-events-none absolute top-1/2 grid aspect-square w-[clamp(84px,10.4vw,200px)] -translate-x-1/2 -translate-y-1/2 select-none place-items-center outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
            style={{
              left,
              opacity: shown ? 1 : 0,
              transition: shown ? 'opacity 500ms ease 700ms' : 'none',
            }}
            onKeyDown={onKeyDown}
            draggable={false}
          >
            <span
              className="block h-full w-full transition-transform duration-200 ease-out"
              style={{ transform: overShape ? 'scale(1.04)' : undefined }}
            >
            <span
              className="relative grid h-full w-full place-items-center bg-brand text-ink will-change-transform"
              style={{ clipPath, transform: `rotate(${rot.toFixed(2)}deg)` }}
            >
              <span
                className="pointer-events-none whitespace-nowrap font-mono text-[clamp(8px,0.72vw,13px)] font-semibold tracking-[0.12em] lg:tracking-[0.16em]"
                style={{ transform: `rotate(${typeRot.toFixed(2)}deg)` }}
              >
                [ LET’S TALK ]
              </span>
            </span>
            </span>
          </a>

          {/* the band: the strip around the rule the pointer moves the shape
              in — as tall as the shape, edge to edge, over everything in the
              strip (the shapes under it are decoration; the link is reached
              through it with a click) */}
          <div
            className={`absolute inset-x-0 top-1/2 z-10 h-[clamp(96px,11.5vw,220px)] -translate-y-1/2 touch-pan-y ${overShape ? 'cursor-pointer' : 'cursor-ew-resize'}`}
            onPointerMove={onBandMove}
            onPointerLeave={onBandLeave}
            onPointerDown={onBandDown}
            onPointerUp={onBandUp}
            onPointerCancel={onBandUp}
            onClick={onBandClick}
            aria-hidden
          />
        </div>
      </div>
    </section>
  )
}
