import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import Eyebrow from './Eyebrow'


type Step = {
  number: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Process Mapping',
    body: 'We begin by deeply mapping how your business currently operates. This includes understanding information flow, decision points, team responsibilities, and where friction exists. This step forms the foundation for everything that follows.',
  },
  {
    number: '02',
    title: 'Creation and Customization',
    body: 'We create custom systems and documentation built specifically around how your business works. Nothing is generic. Everything is shaped according to your actual processes and needs.',
  },
  {
    number: '03',
    title: 'Adoption and Implementation',
    body: 'We help you adopt the right tools and make sure they integrate properly into your operations. We provide the necessary training and support so the systems actually get used and deliver results.',
  },
  {
    number: '04',
    title: 'AI-Readiness and Automation',
    body: 'Once your foundation is solid, we introduce intelligent automation and AI solutions. These are applied only where they create real efficiency and measurable improvement.',
  },
]

/** A measured anchor point on a card, in track-local coordinates. */
type Anchor = { x: number; y: number }

export default function Approach() {
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const [progress, setProgress] = useState(0)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [anchors, setAnchors] = useState<Anchor[]>([])
  const [pathLength, setPathLength] = useState(0)
  const pathRef = useRef<SVGPathElement>(null)

  /**
   * Measure a connector anchor for each card inside the rail that runs down
   * the left of the column. Alternating the anchor between the two edges of
   * the rail is what produces the diagonal zig-zag, and keeping it in the
   * rail means the line is never hidden behind a card.
   */
  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const trackBox = track.getBoundingClientRect()
    const railW = Math.min(150, Math.max(72, trackBox.width * 0.16))
    const inset = 16
    const next: Anchor[] = []

    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const box = card.getBoundingClientRect()
      next.push({
        x: i % 2 === 0 ? inset : railW - inset,
        y: box.top + Math.min(box.height / 2, 52) - trackBox.top,
      })
    })

    setSize({ w: trackBox.width, h: trackBox.height })
    setAnchors(next)
  }, [trackRef])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    const track = trackRef.current
    if (track) ro.observe(track)
    cardRefs.current.forEach((c) => c && ro.observe(c))

    window.addEventListener('resize', measure)
    // Re-measure once webfonts settle, since they change card heights.
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, trackRef])

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength())
  }, [anchors, size.w, size.h])

  /**
   * Progress is derived from the cards' own positions rather than the
   * section's bounding box, so the line always reaches exactly 100% as the
   * final card crosses the trigger line — regardless of section height,
   * viewport size, or how much page follows.
   */
  useEffect(() => {
    let raf = 0
    let queued = false

    const update = () => {
      queued = false
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[]
      if (cards.length < 2) return

      const line = window.innerHeight * 0.62
      const centers = cards.map((c) => {
        const r = c.getBoundingClientRect()
        return r.top + Math.min(r.height / 2, 52)
      })

      let next = 0
      if (centers[0] <= line) {
        let i = 0
        while (i < centers.length - 1 && centers[i + 1] <= line) i++
        if (i >= centers.length - 1) {
          next = 1
        } else {
          const span = centers[i + 1] - centers[i]
          const t = span > 0 ? (line - centers[i]) / span : 0
          next = (i + Math.min(1, Math.max(0, t))) / (centers.length - 1)
        }
      }

      setProgress((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    }

    const onScroll = () => {
      if (queued) return
      queued = true
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [anchors.length])

  /**
   * Diagonal zig-zag: straight diagonal runs between anchors, with the corner
   * at each card softened by a quadratic curve so it reads as one flowing line.
   */
  const buildPath = (pts: Anchor[]) => {
    if (pts.length < 2) return ''
    const r = 26 // corner softening radius
    let d = `M ${pts[0].x} ${pts[0].y}`

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]

      if (i === pts.length - 1) {
        d += ` L ${curr.x} ${curr.y}`
        break
      }

      const next = pts[i + 1]
      const inDx = curr.x - prev.x
      const inDy = curr.y - prev.y
      const inLen = Math.hypot(inDx, inDy) || 1
      const outDx = next.x - curr.x
      const outDy = next.y - curr.y
      const outLen = Math.hypot(outDx, outDy) || 1

      const ri = Math.min(r, inLen / 2)
      const ro = Math.min(r, outLen / 2)

      d += ` L ${curr.x - (inDx / inLen) * ri} ${curr.y - (inDy / inLen) * ri}`
      d += ` Q ${curr.x} ${curr.y} ${curr.x + (outDx / outLen) * ro} ${curr.y + (outDy / outLen) * ro}`
    }

    return d
  }

  const pathData = buildPath(anchors)

  /** How far along the line each node sits, so dots light up in sequence. */
  const nodeThreshold = (i: number) => (anchors.length < 2 ? 0 : i / (anchors.length - 1))

  return (
    <section id="approach" className="relative w-full bg-cream py-24 md:py-32">
      {/* ---------- Ambient background behind the glass ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute -left-32 top-24 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(225,173,52,0.42) 0%, rgba(225,173,52,0) 70%)',
          }}
        />
        <div
          className="absolute -right-24 bottom-10 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(225,173,52,0.30) 0%, rgba(225,173,52,0) 70%)',
          }}
        />
        <div
          className="absolute left-1/3 top-1/2 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(235,201,109,0.38) 0%, rgba(235,201,109,0) 70%)',
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        {/* ---------- The glass box ---------- */}
        <div
          className="relative isolate rounded-[28px] border border-white/70 px-5 py-12 shadow-[0_40px_100px_-40px_rgba(74,54,15,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[36px] sm:px-10 md:px-14 md:py-16"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.56) 0%, rgba(250,239,210,0.34) 45%, rgba(243,221,161,0.40) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          {/* Specular highlight along the top edge */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[36px]"
            aria-hidden="true"
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 45%, transparent)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            {/* ---------- Left: sticky heading ---------- */}
            <div className="lg:h-full">
              <div className="lg:sticky lg:top-32">
                <Eyebrow>How We Work</Eyebrow>

                <h2 className="mt-6 font-display text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink">
                  Our <span className="italic text-brand-600">Approach</span>
                </h2>

                <p className="mt-5 max-w-md text-[clamp(0.98rem,1.15vw,1.08rem)] font-light leading-relaxed text-ink-soft">
                  We follow a clear and structured process to ensure every solution we build is
                  relevant, practical, and sustainable.
                </p>

                {/* Progress readout, tied to the same scroll value as the line */}
                <div className="mt-9 hidden max-w-[280px] lg:block">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    <span>Progress</span>
                    <span className="tabular-nums text-brand-600">
                      {String(Math.min(STEPS.length, Math.floor(progress * STEPS.length) + 1)).padStart(2, '0')}
                      <span className="text-ink-muted"> / 0{STEPS.length}</span>
                    </span>
                  </div>
                  <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---------- Right: cards + zig-zag connector ---------- */}
            <div ref={trackRef} className="relative">
              {/* Connector line, drawn behind the cards */}
              {size.w > 0 && anchors.length === STEPS.length && (
                <svg
                  className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full sm:block"
                  viewBox={`0 0 ${size.w} ${size.h}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="cc-line-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EBC96D" />
                      <stop offset="55%" stopColor="#E1AD34" />
                      <stop offset="100%" stopColor="#C9962A" />
                    </linearGradient>
                    <filter id="cc-line-glow" x="-40%" y="-10%" width="180%" height="120%">
                      <feGaussianBlur stdDeviation="6" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Faint full-length track */}
                  <path
                    ref={pathRef}
                    d={pathData}
                    stroke="#1B1A17"
                    strokeOpacity="0.09"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="6 8"
                  />

                  {/* Animated draw */}
                  {pathLength > 0 && (
                    <path
                      d={pathData}
                      stroke="url(#cc-line-grad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      filter="url(#cc-line-glow)"
                      style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: pathLength * (1 - progress),
                        transition: 'stroke-dashoffset 180ms linear',
                      }}
                    />
                  )}

                  {/* Nodes at each card */}
                  {anchors.map((a, i) => {
                    const reached = progress >= nodeThreshold(i) - 0.02
                    return (
                      <g key={i}>
                        <circle
                          cx={a.x}
                          cy={a.y}
                          r={reached ? 13 : 8}
                          fill="#E1AD34"
                          opacity={reached ? 0.16 : 0}
                          style={{ transition: 'r 400ms ease, opacity 400ms ease' }}
                        />
                        <circle
                          cx={a.x}
                          cy={a.y}
                          r="5"
                          fill={reached ? '#E1AD34' : '#F8F5F0'}
                          stroke={reached ? '#E1AD34' : 'rgba(27,26,23,0.18)'}
                          strokeWidth="2"
                          style={{ transition: 'fill 400ms ease, stroke 400ms ease' }}
                        />
                      </g>
                    )
                  })}
                </svg>
              )}

              {/* Mobile connector: a simple vertical rail */}
              <div
                className="pointer-events-none absolute bottom-6 left-[7px] top-6 w-px sm:hidden"
                aria-hidden="true"
              >
                <div className="h-full w-full bg-ink/10" />
                <div
                  className="absolute inset-x-0 top-0 bg-brand transition-[height] duration-200 ease-out"
                  style={{ height: `${progress * 100}%` }}
                />
              </div>

              {/* Cards */}
              <ol className="relative z-10 space-y-6 pl-6 sm:pl-[clamp(72px,16%,150px)] md:space-y-8">
                {STEPS.map((step, i) => (
                  <StepCard
                    key={step.number}
                    step={step}
                    index={i}
                    reached={progress >= nodeThreshold(i) - 0.06}
                    registerRef={(el) => {
                      cardRefs.current[i] = el
                    }}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


type StepCardProps = {
  step: Step
  index: number
  reached: boolean
  registerRef: (el: HTMLLIElement | null) => void
}

/**
 * A single step. Stays blurred and offset until it scrolls into view, then
 * settles. Each card observes itself so they reveal one after another.
 */
function StepCard({ step, index, reached, registerRef }: StepCardProps) {
  const { ref, revealed } = useReveal<HTMLLIElement>({ threshold: 0.2 })

  return (
    <li
      ref={(el) => {
        ref.current = el
        registerRef(el)
      }}
      className={[
        'group relative rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-0.5 sm:p-7',
        index % 2 === 1 ? 'sm:ml-5 md:ml-8' : '',
        reached
          ? 'border-white/70 shadow-[0_24px_60px_-30px_rgba(74,54,15,0.4)]'
          : 'border-white/40 shadow-[0_16px_40px_-30px_rgba(74,54,15,0.3)]',
      ].join(' ')}
      style={{
        background: reached
          ? 'linear-gradient(140deg, rgba(255,255,255,0.74) 0%, rgba(250,239,210,0.46) 100%)'
          : 'linear-gradient(140deg, rgba(255,255,255,0.44) 0%, rgba(250,239,210,0.26) 100%)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        // Reveal: blur + lift out, settling into place.
        opacity: revealed ? 1 : 0,
        filter: revealed ? 'blur(0px)' : 'blur(14px)',
        transform: revealed ? 'translateY(0) scale(1)' : 'translateY(34px) scale(0.97)',
        transition:
          'opacity 800ms cubic-bezier(0.16,1,0.3,1), filter 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1), background 500ms ease, border-color 500ms ease, box-shadow 500ms ease',
        willChange: 'opacity, transform, filter',
      }}
    >
      {/* Mobile node on the vertical rail */}
      <span
        className={[
          'absolute -left-[23px] top-8 h-[9px] w-[9px] rounded-full border-2 transition-colors duration-500 sm:hidden',
          reached ? 'border-brand bg-brand' : 'border-black/15 bg-cream',
        ].join(' ')}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4">
        <span
          className={[
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-[17px] transition-all duration-500',
            reached
              ? 'bg-brand text-ink shadow-brand'
              : 'bg-white/70 text-ink-muted ring-1 ring-inset ring-black/[0.06]',
          ].join(' ')}
        >
          {step.number}
        </span>

        <div className="min-w-0">
          <h3 className="font-display text-[clamp(1.25rem,1.9vw,1.6rem)] leading-tight tracking-[-0.01em] text-ink">
            {step.title}
          </h3>
          <p className="mt-2.5 text-[15px] font-light leading-relaxed text-ink-soft">{step.body}</p>
        </div>
      </div>
    </li>
  )
}
