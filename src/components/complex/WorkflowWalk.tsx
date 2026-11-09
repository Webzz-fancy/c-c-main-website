import { useEffect, useRef, type RefObject } from 'react'
import type { ComplexProject } from '../../content/complex'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

type MapNode = { x: number; y: number; w: number; h: number }
type MapGeometry = {
  /** One entry per stop, in the order the steps run. */
  nodes: MapNode[]
  /** Wire k joins stop k to stop k + 1. */
  wires: string[]
  /** The access boundary: stops on one side of it are not visible to the other. */
  lane: { axis: 'x' | 'y'; at: number; from: number; to: number }
}

// The drawing lives in a 640 × 460 box starting at (10, 40); the map zooms
// and pans inside it, so every shape shares the same frame.
const ORIGIN_X = 10
const ORIGIN_Y = 40
const WIDTH = 640
const HEIGHT = 460
const CENTRE: [number, number] = [330, 270]

// The team's own side of the line on the left, the other side on the right:
// the third and fourth stops cross over and the work comes back.
const COLUMNS: MapGeometry = {
  nodes: [
    { x: 30, y: 166, w: 168, h: 70 },
    { x: 226, y: 166, w: 168, h: 70 },
    { x: 444, y: 166, w: 176, h: 70 },
    { x: 444, y: 316, w: 176, h: 70 },
    { x: 226, y: 316, w: 168, h: 70 },
    { x: 30, y: 316, w: 168, h: 70 },
  ],
  wires: ['M198 201 H226', 'M394 201 H444', 'M532 236 V316', 'M444 351 H394', 'M226 351 H198'],
  lane: { axis: 'x', at: 419, from: 108, to: 470 },
}

// The first three run along the top on one side of the line, the last three
// run back along the bottom on the other.
const ROWS: MapGeometry = {
  nodes: [
    { x: 24, y: 150, w: 186, h: 70 },
    { x: 232, y: 150, w: 186, h: 70 },
    { x: 440, y: 150, w: 186, h: 70 },
    { x: 440, y: 340, w: 186, h: 70 },
    { x: 232, y: 340, w: 186, h: 70 },
    { x: 24, y: 340, w: 186, h: 70 },
  ],
  wires: ['M210 185 H232', 'M418 185 H440', 'M533 220 V340', 'M440 375 H418', 'M232 375 H210'],
  lane: { axis: 'y', at: 280, from: 24, to: 636 },
}

const SHAPES = { columns: COLUMNS, rows: ROWS }

/**
 * The step by step walk-through inside a project's sheet. The step cards scroll as
 * before; beside them (above them on a phone) the workflow map holds still,
 * zooms to the step being read, lights the wire to the next one as the reader
 * moves on, and pulls back to the whole system after the last. Scrolling back
 * retraces it. With reduced motion the map stays whole and only the step in
 * hand is marked.
 */
export default function WorkflowWalk({ project, scrollRoot }: {
  project: ComplexProject
  /** the popup's scrolling area; left out on a full page, which scrolls the window */
  scrollRoot?: RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = SHAPES[project.map.shape]
  const { map: labels } = project
  const stops = project.stops.slice(0, layout.nodes.length)
  const count = String(stops.length).padStart(2, '0')

  // The scroll container is a parent ref; it is guaranteed to be attached by
  // the time passive effects run, including in production's single mount.
  useEffect(() => {
    const inWindow = !scrollRoot
    const root = inWindow ? document.documentElement : scrollRoot.current
    const walk = ref.current
    if (!root || !walk) return

    const map = walk.querySelector<HTMLElement>('[data-walk-map]')
    const canvas = walk.querySelector<HTMLElement>('[data-walk-canvas]')
    const laneGroup = walk.querySelector<SVGGElement>('[data-walk-lane]')
    const counter = walk.querySelector<HTMLElement>('[data-walk-counter]')
    const meter = walk.querySelector<HTMLElement>('[data-walk-meter]')
    const nodes = Array.from(walk.querySelectorAll<SVGGElement>('[data-walk-node]'))
    const wires = Array.from(walk.querySelectorAll<SVGGElement>('[data-walk-wire]'))
    const steps = Array.from(walk.querySelectorAll<HTMLElement>('[data-walk-step]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = window.matchMedia('(max-width: 760px)')
    if (!map || !canvas || !steps.length) return

    // On a full page the map pins below the site header, and positions are
    // measured from the top of the window rather than the popup.
    const pinnedTop = inWindow ? parseFloat(getComputedStyle(map).top) || 0 : 0
    const scroller: HTMLElement | Window = inWindow ? window : root

    const fraction = (x: number, y: number) => [(x - ORIGIN_X) / WIDTH, (y - ORIGIN_Y) / HEIGHT]
    const centres = layout.nodes.map((n) => [n.x + n.w / 2, n.y + n.h / 2] as const)
    const wide = fraction(...CENTRE)
    const last = stops.length - 1

    /**
     * Where the reader is, as a position on the timeline: the step whose card
     * sits on the reading line, with the fraction of the way to the next one,
     * plus how far the map should stand back (1 is the whole system).
     */
    // On a phone the map takes the top of the sheet, so the reading line sits
    // below it rather than in the middle of the sheet. Measured from the top
    // of the sheet's scroll area while the map is pinned.
    const lineOffset = () => {
      const pinnedMapBottom = pinnedTop + map.offsetHeight + (narrow.matches ? 0 : 4)
      const top = narrow.matches ? pinnedMapBottom : 0
      return top + (root.clientHeight - top) * (narrow.matches ? 0.3 : 0.42)
    }

    // Enough room after the last card for it to reach the reading line and
    // for the map to pull back, all while the map is still pinned.
    const PULL_BACK = 180
    const fit = () => {
      const lastCard = steps[last].offsetHeight
      const pinnedMapBottom = pinnedTop + map.offsetHeight + (narrow.matches ? 0 : 4)
      const tail = PULL_BACK + 40 + pinnedMapBottom - lineOffset() - lastCard / 2
      walk.style.setProperty('--walk-tail', `${Math.max(32, Math.ceil(tail))}px`)
    }

    const read = () => {
      const boxTop = inWindow ? 0 : root.getBoundingClientRect().top
      const mapBox = map.getBoundingClientRect()
      const line = boxTop + lineOffset()
      const rects = steps.map((s) => s.getBoundingClientRect())
      const mids = rects.map((r) => r.top + r.height / 2)

      let index = 0
      if (line >= mids[last]) index = last
      else if (line > mids[0]) {
        let i = 0
        while (i < last - 1 && line >= mids[i + 1]) i += 1
        const within = (line - mids[i]) / Math.max(1, mids[i + 1] - mids[i])
        // Each card holds the map for most of its stretch, then it moves on.
        index = i + smoothstep((within - 0.5) / 0.5)
      }

      const before = 1 - smoothstep((line - rects[0].top) / Math.max(1, mids[0] - rects[0].top))
      // Pull back after the last step, finishing just before the map stops
      // being pinned and scrolls away with the section.
      const past = line - mids[last]
      const pinned = Math.max(0, walk.getBoundingClientRect().bottom - mapBox.bottom - 40)
      const after = past <= 0 ? 0 : smoothstep(past / Math.max(1, past + pinned))
      return { index, back: Math.max(before, after) }
    }

    const draw = (index: number, back: number) => {
      const reduce = motion.matches
      const standBack = reduce ? 1 : back
      const low = Math.floor(index)
      const high = Math.min(last, low + 1)
      const blend = index - low
      const travel = Math.sin(Math.PI * blend)
      const fx0 = centres[low][0] + (centres[high][0] - centres[low][0]) * blend
      const fy0 = centres[low][1] + (centres[high][1] - centres[low][1]) * blend
      const [px, py] = fraction(fx0, fy0)
      const fx = px + (wide[0] - px) * standBack
      const fy = py + (wide[1] - py) * standBack
      const zoomIn = narrow.matches ? 1.6 : 1.85
      const zoomOut = narrow.matches ? 0.94 : 1
      const zoom = (zoomOut + (zoomIn - zoomOut) * (1 - standBack)) * (1 - travel * 0.06)

      canvas.style.setProperty('--fx', fx.toFixed(4))
      canvas.style.setProperty('--fy', fy.toFixed(4))
      canvas.style.setProperty('--zoom', zoom.toFixed(4))
      // The side labels only read on the whole map; zoomed in they would be cut.
      if (laneGroup) laneGroup.style.opacity = standBack.toFixed(3)

      nodes.forEach((node, i) => {
        const near = clamp01(1 - Math.abs(i - index) * 0.62)
        // Pulled back, every stop reads; the one in hand still glows.
        node.style.setProperty('--node-focus', Math.max(near, back * 0.82).toFixed(3))
        node.style.setProperty('--node-glow', near.toFixed(3))
      })

      wires.forEach((wire, k) => {
        const lit = clamp01(index - k)
        const trace = wire.querySelector<SVGPathElement>('[data-walk-trace]')
        const spark = wire.querySelector<SVGPathElement>('[data-walk-spark]')
        if (trace) trace.style.strokeDashoffset = ((1 - lit) * 100).toFixed(2)
        if (spark) {
          spark.style.strokeDashoffset = (7 - lit * 107).toFixed(2)
          spark.style.opacity = (4 * lit * (1 - lit)).toFixed(3)
        }
      })

      const current = Math.round(index)
      steps.forEach((step, i) => {
        if (i === current) step.dataset.active = ''
        else delete step.dataset.active
      })
      if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${count}`
      if (meter) meter.style.setProperty('--meter-progress', (last ? index / last : 1).toFixed(3))
    }

    // The map trails the scroll a touch instead of snapping to it, which makes
    // a long pan read as one movement. A rate, not a per-frame fraction, so a
    // 120Hz screen eases at the same speed as a 60Hz one.
    const EASE_RATE = 12
    let shownIndex = 0
    let shownBack = 1
    let frame = 0
    let then = 0
    let alive = true

    const tick = (now: number) => {
      frame = 0
      if (!alive) return
      const target = read()
      const dt = then ? Math.min((now - then) / 1000, 0.05) : 1 / 60
      then = now
      const ease = motion.matches ? 1 : 1 - Math.exp(-EASE_RATE * dt)
      shownIndex += (target.index - shownIndex) * ease
      shownBack += (target.back - shownBack) * ease
      const settled = Math.abs(target.index - shownIndex) < 0.001 && Math.abs(target.back - shownBack) < 0.001
      if (settled) {
        shownIndex = target.index
        shownBack = target.back
      }
      draw(shownIndex, shownBack)
      if (!settled) frame = requestAnimationFrame(tick)
    }

    const schedule = () => {
      if (frame) return
      then = 0
      frame = requestAnimationFrame(tick)
    }

    const refit = () => {
      fit()
      schedule()
    }

    fit()
    const start = read()
    shownIndex = start.index
    shownBack = start.back
    draw(shownIndex, shownBack)

    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', refit)
    motion.addEventListener('change', schedule)
    narrow.addEventListener('change', refit)
    document.fonts?.ready.then(refit).catch(() => {})
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', refit)
      motion.removeEventListener('change', schedule)
      narrow.removeEventListener('change', refit)
    }
  }, [project, layout, scrollRoot, stops.length, count])

  const { lane } = layout
  const near = labels.near
  const far = labels.far

  return (
    <div ref={ref} className={`complex-walk complex-walk--${project.map.shape}`}>
      <div className="complex-walk__map" data-walk-map>
        <figure className="complex-walk__figure">
          <div className="complex-walk__chrome">
            <span>{labels.caption}</span>
            <span data-walk-counter>{`01 / ${count}`}</span>
          </div>
          <div className="complex-walk__viewport">
            <div className="complex-walk__canvas" data-walk-canvas>
              <span className="complex-walk__grid" aria-hidden="true" />
              <svg
                className="complex-walk__svg"
                viewBox={`${ORIGIN_X} ${ORIGIN_Y} ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
                focusable="false"
              >
                <g className="complex-walk__lane" data-walk-lane>
                  {lane.axis === 'x' ? (
                    <>
                      <line x1={lane.at} y1={lane.from} x2={lane.at} y2={lane.to} />
                      <text textAnchor="end" x={lane.at - 14} y={lane.from - 8}>{near}</text>
                      <text textAnchor="start" x={lane.at + 14} y={lane.from - 8}>{far}</text>
                    </>
                  ) : (
                    <>
                      <line x1={lane.from} y1={lane.at} x2={lane.to} y2={lane.at} />
                      <text textAnchor="start" x={lane.from + 4} y={lane.at - 15}>{near}</text>
                      <text textAnchor="start" x={lane.from + 4} y={lane.at + 26}>{far}</text>
                    </>
                  )}
                </g>
                {layout.wires.slice(0, stops.length - 1).map((d) => (
                  <g key={d} data-walk-wire>
                    <path className="complex-walk__wire" d={d} />
                    <path className="complex-walk__trace" d={d} pathLength={100} strokeDasharray={100} strokeDashoffset={100} data-walk-trace />
                    <path className="complex-walk__spark" d={d} pathLength={100} strokeDasharray="7 1000" data-walk-spark />
                  </g>
                ))}
                {stops.map((stop, i) => {
                  const node = layout.nodes[i]
                  return (
                    <g key={stop.node} className="complex-walk__node" data-walk-node transform={`translate(${node.x} ${node.y})`}>
                      <rect className="complex-walk__halo" x={-7} y={-7} width={node.w + 14} height={node.h + 14} rx={11} />
                      <rect className="complex-walk__paper" width={node.w} height={node.h} rx={6} />
                      <text className="complex-walk__index" x={14} y={23}>{`0${i + 1}`}</text>
                      <text className="complex-walk__title" x={14} y={47}>{stop.node}</text>
                      <text className="complex-walk__detail" x={14} y={63}>{stop.detail}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
          <div className="complex-walk__chrome complex-walk__chrome--foot">
            <span>{labels.note}</span>
            <span className="complex-walk__meter" aria-hidden="true"><span data-walk-meter /></span>
          </div>
        </figure>
      </div>

      <ol className="complex-detail__steps complex-walk__steps">
        {stops.map((stop, i) => (
          <li key={stop.node} data-side={stop.side} data-walk-step>
            <p className="complex-detail__step-head">
              <span>{`${String(i + 1).padStart(2, '0')} / ${count}`}</span>
              <span>{stop.node}</span>
            </p>
            <h4>{stop.title}</h4>
            <p>{stop.body}</p>
            <p className="complex-detail__guard">{stop.guard}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
