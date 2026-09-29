import { useLayoutEffect, useRef } from 'react'
import { COMPLEX } from '../../content/complex'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

const ROUTES = {
  desktop: {
    first: 'M132 500 C128 416 187 395 187 300',
    full: 'M132 500 C128 416 187 395 187 300 C187 205 134 187 132 100',
    stops: [[132, 500], [187, 300], [132, 100]],
    viewBox: '0 0 360 600',
  },
  mobile: {
    first: 'M43 142 C100 145 132 129 190 124',
    full: 'M43 142 C100 145 132 129 190 124 C248 118 292 106 337 104',
    stops: [[43, 142], [190, 124], [337, 104]],
    viewBox: '0 0 380 220',
  },
} as const

function Road({ variant }: { variant: 'desktop' | 'mobile' }) {
  const route = ROUTES[variant]
  const [start, middle, finish] = route.stops

  return (
    <svg className={`complex-journey__road complex-journey__road--${variant}`} viewBox={route.viewBox} aria-hidden="true" focusable="false">
      <path data-road-first d={route.first} fill="none" stroke="none" />
      <path className="complex-journey__road-bed" d={route.full} />
      <path className="complex-journey__road-surface" d={route.full} />
      <path className="complex-journey__road-dashes" d={route.full} />
      <path data-road-path className="complex-journey__road-trace" d={route.full} />
      {[start, middle].map(([x, y], index) => (
        <g key={index} className="complex-journey__stop" transform={`translate(${x} ${y})`}>
          <circle className="complex-journey__stop-ring" r="18" />
          <circle className="complex-journey__stop-core" r="2.5" />
          <text x="23" y="-14">0{index + 1}</text>
        </g>
      ))}
      <g data-road-traveler className="complex-journey__traveler" transform={`translate(${start[0]} ${start[1]})`}>
        <circle className="complex-journey__traveler-glow" r="23" />
        <circle className="complex-journey__traveler-ring" r="11" />
        <circle className="complex-journey__traveler-core" r="4" />
      </g>
      <g className="complex-journey__goal" transform={`translate(${finish[0]} ${finish[1]})`}>
        <circle className="complex-journey__goal-glow" r="24" />
        <circle className="complex-journey__goal-disc" r="18" />
        <path className="complex-journey__goal-pole" d="M-7 12 V-13" />
        <path className="complex-journey__goal-flag" d="M-6 -12 H12 V-2 H-6 Z" />
        <path className="complex-journey__goal-fold" d="M-6 -12 H3 V-7 H-6 Z M3 -7 H12 V-2 H3 Z" />
      </g>
    </svg>
  )
}

/** The panel pins while the reader travels the route; normal content is the no-JS/reduced-motion fallback. */
export default function MethodJourney() {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return

    const stage = section.querySelector<HTMLElement>('[data-journey-stage]')
    const start = section.querySelector<HTMLElement>('[data-journey-start]')
    const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-journey-card]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = window.matchMedia('(max-width: 780px)')
    if (!stage || !start) return

    const routes = Array.from(section.querySelectorAll<SVGSVGElement>('.complex-journey__road')).map((svg) => ({
      path: svg.querySelector<SVGPathElement>('[data-road-path]')!,
      first: svg.querySelector<SVGPathElement>('[data-road-first]')!,
      traveler: svg.querySelector<SVGGElement>('[data-road-traveler]')!,
      length: 0,
      middle: 0,
    }))
    // A hidden responsive SVG may report length zero in some browsers; measure
    // again when the layout changes, before trying to place its marker.
    const measureRoutes = () => routes.forEach((route) => {
      const length = route.path.getTotalLength()
      if (length > 0) {
        route.length = length
        route.middle = route.first.getTotalLength() / length
      }
    })

    let frame = 0
    let active = true
    const draw = () => {
      frame = 0
      if (section.dataset.journey !== 'on') return

      const rect = section.getBoundingClientRect()
      const startTop = start.getBoundingClientRect().top
      const progress = narrow.matches
        ? clamp01((80 - startTop) /
            Math.max(1, rect.height - (startTop - rect.top) - stage.offsetHeight - 24))
        : clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight))

      // Hold briefly at each stop so there is time to read. The road catches up
      // during the two passages; reverse scroll retraces exactly the same route.
      const betweenStops = progress < .42
        ? smoothstep((progress - .14) / .28) * .5
        : .5 + smoothstep((progress - .59) / .27) * .5
      const travel = progress >= .42 && progress <= .59 ? .5 : betweenStops

      routes.forEach(({ path, traveler, length, middle }) => {
        if (!length) return
        const distance = travel <= .5
          ? length * middle * (travel / .5)
          : length * (middle + (1 - middle) * ((travel - .5) / .5))
        const point = path.getPointAtLength(distance)
        traveler.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`)
        path.style.strokeDashoffset = `${(length - distance).toFixed(2)}`
      })

      const focus = [
        1 - smoothstep((progress - .18) / .22),
        smoothstep((progress - .26) / .16) * (1 - smoothstep((progress - .63) / .19)),
        smoothstep((progress - .70) / .16),
      ]
      cards.forEach((card, index) => {
        const visible = focus[index]
        card.style.setProperty('--card-focus', visible.toFixed(3))
        card.style.setProperty('--card-blur', `${((1 - visible) * 8).toFixed(1)}px`)
        card.style.setProperty('--card-shift', `${((1 - visible) * 16).toFixed(1)}px`)
      })
      stage.style.setProperty('--route-progress', travel.toFixed(3))
      stage.style.setProperty('--goal-lit', smoothstep((progress - .78) / .1).toFixed(3))
      stage.style.setProperty('--traveler-fade', (1 - smoothstep((progress - .84) / .08)).toFixed(3))
    }

    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw) }
    const preference = () => {
      // Below this height a pinned panel would crowd the copy; use the static
      // glass cards instead of trapping the reader in an unreadable viewport.
      const enabled = !motion.matches && window.innerHeight >= 640
      section.dataset.journey = enabled ? 'on' : 'off'
      measureRoutes()
      if (enabled) {
        routes.forEach(({ path, length }) => { if (length) path.style.strokeDasharray = `${length}` })
        draw()
      } else {
        routes.forEach(({ path, traveler }) => {
          path.style.strokeDasharray = ''
          path.style.strokeDashoffset = ''
          const point = path.getPointAtLength(0)
          traveler.setAttribute('transform', `translate(${point.x} ${point.y})`)
        })
      }
    }

    preference()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', preference)
    motion.addEventListener('change', preference)
    document.fonts?.ready.then(schedule).catch(() => {})
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', preference)
      motion.removeEventListener('change', preference)
    }
  }, [])

  return (
    <section ref={ref} id="complex-approach" className="complex-method" aria-labelledby="complex-method-title">
      <div className="complex-method__inner">
        <div className="complex-method__intro">
          <p className="complex-eyebrow">01 / {COMPLEX.method.label}</p>
          <h2 id="complex-method-title">{COMPLEX.method.heading[0]}{' '}<br /><em>{COMPLEX.method.heading[1]}</em></h2>
          <p>{COMPLEX.method.intro}</p>
        </div>
        <div className="complex-method__story">
          <span className="complex-method__start" data-journey-start aria-hidden="true" />
          <div className="complex-journey" data-journey-stage>
            <div className="complex-journey__chrome" aria-hidden="true"><span>01 — 03</span></div>
            <Road variant="desktop" />
            <Road variant="mobile" />
            <ol className="complex-journey__cards">
              {COMPLEX.method.steps.map((step, index) => (
                <li key={step.title} className="complex-journey__card" data-journey-card>
                  <span className="complex-journey__card-step">0{index + 1} / {step.phase}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="complex-journey__footer" aria-hidden="true">
              <span className="complex-journey__meter"><span /></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
