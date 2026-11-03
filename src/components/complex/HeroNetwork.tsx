import { useState } from 'react'

type Phase = 'split' | 'merge' | 'finish'
type NodePhase = 'source' | 'branch' | 'combine' | 'result'

type Module = {
  id: string
  phase: NodePhase
  label: string
  title: string
  x: number
  y: number
  w: number
  h: number
}

type Link = { id: string; phase: Phase; d: string }

type Layout = { viewBox: string; modules: Module[]; links: Link[] }

// The problem an agent takes on, on the left; the three things it does, the
// agent and the check before anything leaves; on the right, the outcome. The text
// comes from SCENARIOS; the paper modules and right-angle paths are our own.
const desktop: Layout = {
  viewBox: '0 0 740 540',
  modules: [
    { id: 'source', phase: 'source', label: 'THE PROBLEM', title: '', x: 4, y: 240, w: 172, h: 64 },
    { id: 'a', phase: 'branch', label: '01', title: '', x: 196, y: 70, w: 123, h: 72 },
    { id: 'b', phase: 'branch', label: '02', title: '', x: 196, y: 235, w: 123, h: 72 },
    { id: 'c', phase: 'branch', label: '03', title: '', x: 196, y: 400, w: 123, h: 72 },
    { id: 'map', phase: 'combine', label: '04 · AGENT', title: '', x: 372, y: 150, w: 152, h: 72 },
    { id: 'build', phase: 'combine', label: '05 · CHECK', title: '', x: 372, y: 330, w: 152, h: 72 },
    { id: 'result', phase: 'result', label: 'THE OUTCOME', title: '', x: 558, y: 236, w: 180, h: 80 },
  ],
  links: [
    { id: 'input-people', phase: 'split', d: 'M176 272 H186 V106 H196' },
    { id: 'input-process', phase: 'split', d: 'M176 272 H196' },
    { id: 'input-decisions', phase: 'split', d: 'M176 272 H186 V436 H196' },
    { id: 'people-map', phase: 'merge', d: 'M319 106 H345 V186 H372' },
    { id: 'process-map', phase: 'merge', d: 'M319 271 H355 V186 H372' },
    { id: 'decisions-build', phase: 'merge', d: 'M319 436 H355 V366 H372' },
    { id: 'map-output', phase: 'finish', d: 'M524 186 H541 V276 H558' },
    { id: 'build-output', phase: 'finish', d: 'M524 366 H549 V276 H558' },
  ],
}

// On phones the same seven modules read top-to-bottom at a legible size.
const mobile: Layout = {
  viewBox: '0 0 380 400',
  modules: [
    { id: 'source', phase: 'source', label: 'THE PROBLEM', title: '', x: 100, y: 8, w: 180, h: 52 },
    { id: 'a', phase: 'branch', label: '01', title: '', x: 4, y: 103, w: 118, h: 54 },
    { id: 'b', phase: 'branch', label: '02', title: '', x: 131, y: 103, w: 118, h: 54 },
    { id: 'c', phase: 'branch', label: '03', title: '', x: 258, y: 103, w: 118, h: 54 },
    { id: 'map', phase: 'combine', label: '04 · AGENT', title: '', x: 27, y: 211, w: 156, h: 56 },
    { id: 'build', phase: 'combine', label: '05 · CHECK', title: '', x: 197, y: 211, w: 156, h: 56 },
    { id: 'result', phase: 'result', label: 'THE OUTCOME', title: '', x: 100, y: 315, w: 180, h: 62 },
  ],
  links: [
    { id: 'input-people', phase: 'split', d: 'M190 60 V81 H63 V103' },
    { id: 'input-process', phase: 'split', d: 'M190 60 V103' },
    { id: 'input-decisions', phase: 'split', d: 'M190 60 V81 H317 V103' },
    { id: 'people-map', phase: 'merge', d: 'M63 157 V182 H105 V211' },
    { id: 'process-map', phase: 'merge', d: 'M190 157 V182 H105 V211' },
    { id: 'decisions-build', phase: 'merge', d: 'M317 157 V182 H275 V211' },
    { id: 'map-output', phase: 'finish', d: 'M105 267 V291 H190 V315' },
    { id: 'build-output', phase: 'finish', d: 'M275 267 V291 H190 V315' },
  ],
}

type Scenario = {
  source: string
  a: string
  b: string
  c: string
  map: string
  build: string
  result: string
}

// One loop per job our agents take on, keyed by the task in the search
// (and `agents` for the whole office), so a search can bring up its own.
const SCENARIOS: Record<string, Scenario> = {
  agents: { source: 'Owner overload', a: 'Leads', b: 'Reports', c: 'Content', map: 'Director agent', build: 'Agent teams', result: 'Your AI agents' },
  enquiries: { source: 'Missed enquiries', a: 'Reads DMs', b: 'Answers', c: 'Qualifies', map: 'Reply agent', build: 'Hands to you', result: 'Nothing missed' },
  leads: { source: 'Leads go cold', a: 'Researches', b: 'Drafts', c: 'Follows up', map: 'Outreach agent', build: 'Your yes', result: 'Warm pipeline' },
  reports: { source: 'Reports by hand', a: 'Numbers', b: 'Targets', c: 'Slips', map: 'Report agent', build: 'Director', result: 'Daily report' },
  proposals: { source: 'Slow proposals', a: 'Call notes', b: 'Pricing', c: 'Draft', map: 'Proposal agent', build: 'Your review', result: 'Ready to send' },
  content: { source: 'Content slips', a: 'Ideas', b: 'Drafts', c: 'Checks', map: 'Content agent', build: 'QA agent', result: 'Posts on time' },
}
const ORDER = Object.keys(SCENARIOS)

function NetworkSvg({ layout, variant, scenario, onLoop }: {
  layout: Layout
  variant: 'desktop' | 'mobile'
  scenario: Scenario
  onLoop: () => void
}) {
  return (
    <svg className={`complex-map__svg complex-map__svg--${variant}`} viewBox={layout.viewBox} preserveAspectRatio="xMidYMid meet" focusable="false">
      {layout.links.map((link) => (
        <g key={link.id}>
          <path className="complex-map__wire" d={link.d} />
          <path className={`complex-map__charge complex-map__charge--${link.phase}`} d={link.d} pathLength={100} strokeDasharray="100" strokeDashoffset="100" />
          <path className={`complex-map__spark complex-map__spark--${link.phase}`} d={link.d} pathLength={100} strokeDasharray="10 1000" strokeDashoffset="10" />
        </g>
      ))}
      {layout.modules.map((node) => (
        <g key={node.id} className={`complex-map__module complex-map__module--${node.phase}`} transform={`translate(${node.x} ${node.y})`}>
          <rect className="complex-map__halo" x={-5} y={-5} width={node.w + 10} height={node.h + 10} rx={9} />
          <rect className="complex-map__paper" width={node.w} height={node.h} rx={5} />
          <rect
            className="complex-map__highlight"
            width={node.w}
            height={node.h}
            rx={5}
            onAnimationIteration={node.phase === 'result' ? onLoop : undefined}
          />
          <text className="complex-map__label" x={13} y={node.h / 2 - 5}>{node.label}</text>
          <text key={scenario[node.id as keyof Scenario]} className="complex-map__title" x={13} y={node.h / 2 + 18}>
            {scenario[node.id as keyof Scenario]}
          </text>
        </g>
      ))}
    </svg>
  )
}

/**
 * The electrical trace loops on its own; each time it finishes, the next job
 * an agent takes on takes its place. When a visitor's search lands on one of
 * those tasks, the map shows it and holds it.
 */
export default function HeroNetwork({ focus = null }: { focus?: string | null }) {
  const [index, setIndex] = useState(0)
  const pinned = focus && SCENARIOS[focus] ? focus : null
  const scenario = SCENARIOS[pinned ?? ORDER[index]]
  // the first scenario is there from the first frame; later ones fade in
  const moved = index > 0 || pinned !== null

  const next = () => {
    if (!pinned) setIndex((i) => (i + 1) % ORDER.length)
  }

  return (
    <div className="complex-map" aria-hidden="true" data-moved={moved ? '' : undefined}>
      <span className="complex-map__grid" />
      <NetworkSvg layout={desktop} variant="desktop" scenario={scenario} onLoop={next} />
      <NetworkSvg layout={mobile} variant="mobile" scenario={scenario} onLoop={next} />
    </div>
  )
}
