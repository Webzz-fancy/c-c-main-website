import { useLayoutEffect, useRef } from 'react'
import type { ComplexProject } from '../../content/complex'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

type MapNode = { x: number; y: number; w: number; h: number }
type MapLayout = {
  /** viewBox and the user-space box the node coordinates live in. */
  viewBox: string
  width: number
  height: number
  originX: number
  originY: number
  /** One entry per stop, in the order the story tells them. */
  nodes: MapNode[]
  /** Wire k joins stop k to stop k + 1. */
  wires: string[]
  /** The access boundary: nodes on one side of it are not visible to the other. */
  lane: { axis: 'x' | 'y'; at: number; from: number; to: number; near: string; far: string }
  lock: [number, number]
  /** Point the whole map returns to when it zooms back out. */
  centre: [number, number]
  caption: string
  note: string
}

const WIDTH = 640
const HEIGHT = 460

// Two real workflows, drawn as they are operated: the admin side on the left of
// the boundary, the invited expert on the right. Access is part of the drawing,
// not a footnote under it.
const BIDDING: MapLayout = {
  viewBox: '10 40 640 460',
  width: WIDTH,
  height: HEIGHT,
  originX: 10,
  originY: 40,
  nodes: [
    { x: 40, y: 166, w: 155, h: 70 },
    { x: 230, y: 166, w: 165, h: 70 },
    { x: 445, y: 166, w: 165, h: 70 },
    { x: 445, y: 316, w: 165, h: 70 },
    { x: 230, y: 316, w: 165, h: 70 },
    { x: 40, y: 316, w: 155, h: 70 },
  ],
  wires: ['M195 201 H230', 'M395 201 H445', 'M527.5 236 V316', 'M445 351 H395', 'M230 351 H195'],
  lane: { axis: 'x', at: 425, from: 108, to: 470, near: 'Admin workspace', far: 'Invited experts' },
  lock: [425, 275],
  centre: [330, 265],
  caption: 'Invitation-only process',
  note: 'Nobody outside the shortlist is ever shown the brief.',
}

const LAHA: MapLayout = {
  viewBox: '10 40 640 460',
  width: WIDTH,
  height: HEIGHT,
  originX: 10,
  originY: 40,
  nodes: [
    { x: 40, y: 150, w: 160, h: 70 },
    { x: 240, y: 150, w: 170, h: 70 },
    { x: 450, y: 150, w: 170, h: 70 },
    { x: 450, y: 340, w: 170, h: 70 },
    { x: 240, y: 340, w: 170, h: 70 },
    { x: 40, y: 340, w: 160, h: 70 },
  ],
  wires: ['M200 185 H240', 'M410 185 H450', 'M535 220 V340', 'M450 375 H410', 'M240 375 H200'],
  lane: { axis: 'y', at: 280, from: 30, to: 650, near: 'Team workspace · admin only', far: 'Live on the site' },
  lock: [535, 280],
  centre: [330, 265],
  caption: 'The work behind every booking',
  note: 'Notes and ID files stay behind the team’s sign-in.',
}

const LAYOUTS: Record<string, MapLayout> = { bidding: BIDDING, laha: LAHA }

function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g className="complex-project__lock" transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r="15" />
      <path d="M-4 0.5 h8 v6.5 h-8 z" />
      <path d="M-2.6 0.5 v-2.2 a2.6 2.6 0 0 1 5.2 0 v2.2" />
    </g>
  )
}

function WorkflowMap({ project, layout }: { project: ComplexProject; layout: MapLayout }) {
  const { lane } = layout

  return (
    <div className="complex-project__map">
      <figure className="complex-project__figure">
        <div className="complex-project__chrome">
          <span>{layout.caption}</span>
          <span data-project-counter>{`01 / 0${project.stops.length}`}</span>
        </div>
        <div className="complex-project__viewport">
          <div className="complex-project__canvas" data-project-canvas>
            <span className="complex-project__grid" aria-hidden="true" />
            <svg
              className="complex-project__svg"
              viewBox={layout.viewBox}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
            >
              <g className="complex-project__lane">
                {lane.axis === 'x' ? (
                  <>
                    <line x1={lane.at} y1={lane.from} x2={lane.at} y2={lane.to} />
                    <text className="complex-project__lane-near" textAnchor="end" x={lane.at - 14} y={lane.from - 8}>{lane.near}</text>
                    <text className="complex-project__lane-far" textAnchor="start" x={lane.at + 14} y={lane.from - 8}>{lane.far}</text>
                  </>
                ) : (
                  <>
                    <line x1={lane.from} y1={lane.at} x2={lane.to} y2={lane.at} />
                    <text className="complex-project__lane-near" textAnchor="start" x={lane.from + 8} y={lane.at - 15}>{lane.near}</text>
                    <text className="complex-project__lane-far" textAnchor="start" x={lane.from + 8} y={lane.at + 26}>{lane.far}</text>
                  </>
                )}
              </g>
              {layout.wires.map((d, index) => (
                <g key={d} className="complex-project__wire-group" data-wire={index}>
                  <path className="complex-project__wire" d={d} />
                  <path
                    className="complex-project__trace"
                    d={d}
                    pathLength={100}
                    strokeDasharray={100}
                    data-wire-trace
                  />
                  <path
                    className="complex-project__spark"
                    d={d}
                    pathLength={100}
                    strokeDasharray="7 1000"
                    data-wire-spark
                  />
                </g>
              ))}
              {layout.nodes.map((node, index) => {
                const stop = project.stops[index]
                return (
                  <g
                    key={stop.node}
                    className="complex-project__node"
                    data-map-node={index}
                    transform={`translate(${node.x} ${node.y})`}
                  >
                    <rect className="complex-project__node-halo" x={-7} y={-7} width={node.w + 14} height={node.h + 14} rx={11} />
                    <rect className="complex-project__node-paper" width={node.w} height={node.h} rx={6} />
                    <text className="complex-project__node-index" x={14} y={23}>{`0${index + 1}`}</text>
                    <text className="complex-project__node-title" x={14} y={47}>{stop.node}</text>
                    <text className="complex-project__node-detail" x={14} y={64}>{stop.detail}</text>
                  </g>
                )
              })}
              <Lock x={layout.lock[0]} y={layout.lock[1]} />
            </svg>
          </div>
        </div>
        <div className="complex-project__chrome complex-project__chrome--foot">
          <span>{layout.note}</span>
          <span className="complex-project__meter" aria-hidden="true">
            <span data-project-meter />
          </span>
        </div>
      </figure>
    </div>
  )
}

/**
 * The same map on a narrow screen: the flow stood upright, one chip per step,
 * wired top to bottom and marked with the side of the boundary each step sits
 * on. It reads before the copy, so the drawing is never a decoration.
 */
function NarrowMap({ project, layout }: { project: ComplexProject; layout: MapLayout }) {
  return (
    <figure className="complex-project__figure complex-project__figure--narrow">
      <div className="complex-project__chrome">
        <span>{layout.caption}</span>
        <span>{`01 / ${String(project.stops.length).padStart(2, '0')}`}</span>
      </div>
      <ol className="complex-project__rail">
        {project.stops.map((stop, index) => (
          <li key={stop.node} className="complex-project__rail-step" data-side={stop.side}>
            <span className="complex-project__rail-link" aria-hidden="true" />
            <span className="complex-project__rail-node">
              <span className="complex-project__rail-head">
                <span className="complex-project__rail-index">{`0${index + 1}`}</span>
                <span className="complex-project__rail-title">{stop.node}</span>
              </span>
              <span className="complex-project__rail-detail">{stop.detail}</span>
              <span className="complex-project__rail-side">
                {stop.side === 'near' ? layout.lane.near : layout.lane.far}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <div className="complex-project__chrome complex-project__chrome--foot">
        <span>{layout.note}</span>
      </div>
    </figure>
  )
}

/**
 * One project, told as the workflow it actually is. The map pins beside the
 * copy: it opens wide, zooms to the first stop, follows the light from stop to
 * stop, then pulls back to the whole system. On narrow or reduced-motion
 * viewports the same stops read as an ordered list beside a full map.
 */
export default function ProjectStory({ project }: { project: ComplexProject }) {
  const ref = useRef<HTMLElement>(null)
  const layout = LAYOUTS[project.id]
  const stops = project.stops
  const units = 1 + stops.length + 1.6

  useLayoutEffect(() => {
    const section = ref.current
    if (!section) return

    const canvas = section.querySelector<HTMLElement>('[data-project-canvas]')
    const nodes = Array.from(section.querySelectorAll<SVGGElement>('[data-map-node]'))
    const wires = Array.from(section.querySelectorAll<SVGGElement>('[data-wire]'))
    const panels = Array.from(section.querySelectorAll<HTMLElement>('[data-panel]'))
    const counter = section.querySelector<HTMLElement>('[data-project-counter]')
    const meter = section.querySelector<HTMLElement>('[data-project-meter]')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!canvas || !layout) return

    const centres = layout.nodes.map((node) => [node.x + node.w / 2, node.y + node.h / 2] as const)
    const fraction = ([x, y]: readonly [number, number]) => [
      (x - layout.originX) / layout.width,
      (y - layout.originY) / layout.height,
    ]
    const wide = fraction(layout.centre)
    // A comfortable zoom: the active stop reads on its own, its neighbours hint
    // at the edge of the frame.
    const ZOOM = 2
    // How much of the remaining distance the drawing covers per frame. The map
    // trails the scroll slightly instead of snapping to it, which is what makes
    // a long pan read as one movement.
    const EASE = 0.14

    let frame = 0
    let active = true
    let shown = 0
    // Set while the story is off screen, so the next draw starts from the
    // reader's position rather than easing in from where the map was left.
    let resume = true

    /** The timeline position the scroll is asking for, or null if off screen. */
    const read = (force = false) => {
      const rect = section.getBoundingClientRect()
      // Nothing to redraw while the story is off screen, but never leave the
      // panels stacked before the first draw.
      if (!force && (rect.bottom < -80 || rect.top > window.innerHeight + 80)) return null
      const progress = clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight))
      return progress * units
    }

    const draw = (t: number) => {
      const stopCount = stops.length

      // Timeline: open wide → zoom to the first stop → one window per stop →
      // pull back to the whole system. Scrolling back retraces it exactly.
      const zoomIn = smoothstep((t - 0.5) / 0.62)
      const after = Math.max(0, t - (1 + stopCount))
      const wideBlend = t < 1 ? 1 - zoomIn : smoothstep((after - 0.35) / 0.85)

      let focusIndex = 0
      let travel = 0
      if (t >= 1 && t < 1 + stopCount) {
        const local = t - 1
        const current = Math.min(stopCount - 1, Math.floor(local))
        const within = local - current
        // The last stop has nowhere left to travel.
        travel = current >= stopCount - 1 ? 0 : smoothstep((within - 0.68) / 0.32)
        focusIndex = current + travel
      } else if (t >= 1 + stopCount) {
        focusIndex = stopCount - 1
      }

      const low = Math.min(stopCount - 1, Math.floor(focusIndex))
      const high = Math.min(stopCount - 1, low + 1)
      const blend = focusIndex - low
      const centre = [
        centres[low][0] + (centres[high][0] - centres[low][0]) * blend,
        centres[low][1] + (centres[high][1] - centres[low][1]) * blend,
      ]
      const focus = fraction([centre[0], centre[1]])
      const fx = focus[0] + (wide[0] - focus[0]) * wideBlend
      const fy = focus[1] + (wide[1] - focus[1]) * wideBlend

      canvas.style.setProperty('--fx', fx.toFixed(4))
      canvas.style.setProperty('--fy', fy.toFixed(4))
      canvas.style.setProperty('--zoom', ((1 + (ZOOM - 1) * (1 - wideBlend)) * (1 - Math.sin(Math.PI * travel) * 0.07)).toFixed(4))

      nodes.forEach((node, i) => {
        const prominence = Math.max(wideBlend, clamp01(1 - Math.abs(i - focusIndex) * 0.62))
        node.style.setProperty('--node-focus', prominence.toFixed(3))
      })

      wires.forEach((wire, k) => {
        // Wire k lights as the reader leaves stop k and arrives at stop k + 1.
        const local = t - 1 - k
        const lit = local >= 1 ? 1 : clamp01(smoothstep((local - 0.54) / 0.4))
        const trace = wire.querySelector<SVGPathElement>('[data-wire-trace]')
        const spark = wire.querySelector<SVGPathElement>('[data-wire-spark]')
        if (trace) trace.style.strokeDashoffset = `${((1 - lit) * 100).toFixed(2)}`
        if (spark) {
          spark.style.strokeDashoffset = `${(7 - lit * 107).toFixed(2)}`
          spark.style.opacity = (4 * lit * (1 - lit)).toFixed(3)
        }
      })

      panels.forEach((panel) => {
        const kind = panel.dataset.panel
        let focus: number
        if (kind === 'intro') {
          // The lead reads while the map is still whole.
          focus = 1 - smoothstep((t - 0.6) / 0.7)
        } else if (kind === 'result') {
          // Crossfades with the last stop, settles as the map pulls back, and
          // holds to the end of the section.
          focus = smoothstep((t - (1 + stopCount)) / 0.5)
        } else {
          // Each stop holds at full strength for over half its window, then
          // crossfades with the next one as the map pans across.
          const distance = Math.abs(t - (1 + Number(panel.dataset.index) + 0.42))
          focus = 1 - smoothstep((distance - 0.28) / 0.5)
        }
        panel.style.setProperty('--panel-focus', clamp01(focus).toFixed(3))
      })

      if (counter) counter.textContent = `${String(Math.round(focusIndex) + 1).padStart(2, '0')} / ${String(stopCount).padStart(2, '0')}`
      if (meter) meter.style.setProperty('--meter-progress', clamp01((t - 1) / stopCount).toFixed(3))
    }

    /** Follow the scroll: step toward it, repaint, and stop once it settles. */
    const tick = () => {
      frame = 0
      if (!active || section.dataset.project !== 'on') return
      const next = read()
      if (next === null) {
        resume = true
        return
      }
      if (resume) {
        resume = false
        shown = next
        draw(shown)
        return
      }
      const delta = next - shown
      if (Math.abs(delta) < 0.001) {
        shown = next
        draw(shown)
        return
      }
      shown += delta * EASE
      draw(shown)
      frame = requestAnimationFrame(tick)
    }

    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(tick) }

    const settle = () => {
      // With no scroll timeline, the map is shown whole and every stop is lit.
      canvas.style.removeProperty('--fx')
      canvas.style.removeProperty('--fy')
      canvas.style.removeProperty('--zoom')
      nodes.forEach((node) => node.style.removeProperty('--node-focus'))
      wires.forEach((wire) => {
        wire.querySelectorAll<SVGPathElement>('path').forEach((path) => {
          path.style.removeProperty('stroke-dashoffset')
          path.style.removeProperty('opacity')
        })
      })
      panels.forEach((panel) => panel.style.removeProperty('--panel-focus'))
      if (counter) counter.textContent = `01 / ${String(stops.length).padStart(2, '0')}`
    }

    const preference = () => {
      // The pinned map needs a wide, tall enough viewport to stay legible.
      const enabled = !motion.matches && window.innerWidth >= 1120 && window.innerHeight >= 640
      section.dataset.project = enabled ? 'on' : 'off'
      if (enabled) {
        // More scroll per stop than the map's own length, so the sequence is
        // walked rather than skimmed.
        section.style.height = `${(units * 76).toFixed(1)}svh`
        shown = read(true) ?? 0
        resume = false
        draw(shown)
      } else {
        section.style.removeProperty('height')
        settle()
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
  }, [layout, stops.length, units])

  const panelCount = stops.length

  return (
    <article ref={ref} className={`complex-project complex-project--${project.id}`} data-project="off">
      <div className="complex-project__stage">
        <WorkflowMap project={project} layout={layout} />
        <NarrowMap project={project} layout={layout} />
        <div className="complex-project__copy">
          <header className="complex-project__head">
            <p className="complex-project__eyebrow">
              <span>{project.number}</span>
              <span aria-hidden="true" />
              <span>{project.label}</span>
            </p>
            <h2>{project.title}</h2>
          </header>
          <div className="complex-project__panels">
            <section className="complex-project__panel complex-project__panel--intro" data-panel="intro">
              <p className="complex-project__lede">{project.lede}</p>
            </section>
            {stops.map((stop, i) => (
              <section key={stop.title} className="complex-project__panel" data-panel="stop" data-index={i}>
                <p className="complex-project__step">
                  <span>{`0${i + 1} / ${String(panelCount).padStart(2, '0')}`}</span>
                  <span>{stop.node}</span>
                </p>
                <h3>{stop.title}</h3>
                <p className="complex-project__body">{stop.body}</p>
                <p className="complex-project__guard">
                  <svg viewBox="0 0 12 14" aria-hidden="true" focusable="false">
                    <path d="M2 6V4.2a4 4 0 0 1 8 0V6" />
                    <rect x=".8" y="5.8" width="10.4" height="7.4" rx="1.4" />
                  </svg>
                  {stop.guard}
                </p>
              </section>
            ))}
            <section className="complex-project__panel complex-project__panel--result" data-panel="result">
              <p className="complex-project__result">{project.result}</p>
            </section>
          </div>
        </div>
      </div>
    </article>
  )
}
