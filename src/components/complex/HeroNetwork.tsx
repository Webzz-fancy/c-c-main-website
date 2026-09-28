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

// An original illustration of one input branching into three considerations,
// becoming two pieces of work, and arriving at one useful system. The paper
// modules and right-angle paths are our own, not the reference stock image.
const desktop: Layout = {
  viewBox: '0 0 740 540',
  modules: [
    { id: 'source', phase: 'source', label: 'INPUT', title: 'The work', x: 20, y: 240, w: 112, h: 64 },
    { id: 'people', phase: 'branch', label: '01', title: 'People', x: 210, y: 70, w: 123, h: 72 },
    { id: 'process', phase: 'branch', label: '02', title: 'Process', x: 210, y: 235, w: 123, h: 72 },
    { id: 'decisions', phase: 'branch', label: '03', title: 'Decisions', x: 210, y: 400, w: 123, h: 72 },
    { id: 'map', phase: 'combine', label: '04', title: 'Map', x: 415, y: 150, w: 120, h: 72 },
    { id: 'build', phase: 'combine', label: '05', title: 'Build', x: 415, y: 330, w: 120, h: 72 },
    { id: 'result', phase: 'result', label: 'OUTPUT', title: 'One system', x: 612, y: 236, w: 125, h: 80 },
  ],
  links: [
    { id: 'input-people', phase: 'split', d: 'M132 272 H170 V106 H210' },
    { id: 'input-process', phase: 'split', d: 'M132 272 H210' },
    { id: 'input-decisions', phase: 'split', d: 'M132 272 H170 V436 H210' },
    { id: 'people-map', phase: 'merge', d: 'M333 106 H370 V186 H415' },
    { id: 'process-map', phase: 'merge', d: 'M333 271 H380 V186 H415' },
    { id: 'decisions-build', phase: 'merge', d: 'M333 436 H380 V366 H415' },
    { id: 'map-output', phase: 'finish', d: 'M535 186 H574 V276 H612' },
    { id: 'build-output', phase: 'finish', d: 'M535 366 H582 V276 H612' },
  ],
}

// On phones the same seven modules read top-to-bottom at a legible size.
const mobile: Layout = {
  viewBox: '0 0 380 400',
  modules: [
    { id: 'source', phase: 'source', label: 'INPUT', title: 'The work', x: 132, y: 8, w: 116, h: 52 },
    { id: 'people', phase: 'branch', label: '01', title: 'People', x: 10, y: 103, w: 106, h: 54 },
    { id: 'process', phase: 'branch', label: '02', title: 'Process', x: 137, y: 103, w: 106, h: 54 },
    { id: 'decisions', phase: 'branch', label: '03', title: 'Decisions', x: 264, y: 103, w: 106, h: 54 },
    { id: 'map', phase: 'combine', label: '04', title: 'Map', x: 75, y: 211, w: 108, h: 56 },
    { id: 'build', phase: 'combine', label: '05', title: 'Build', x: 197, y: 211, w: 108, h: 56 },
    { id: 'result', phase: 'result', label: 'OUTPUT', title: 'One system', x: 123, y: 315, w: 134, h: 62 },
  ],
  links: [
    { id: 'input-people', phase: 'split', d: 'M190 60 V81 H63 V103' },
    { id: 'input-process', phase: 'split', d: 'M190 60 V103' },
    { id: 'input-decisions', phase: 'split', d: 'M190 60 V81 H317 V103' },
    { id: 'people-map', phase: 'merge', d: 'M63 157 V182 H129 V211' },
    { id: 'process-map', phase: 'merge', d: 'M190 157 V182 H129 V211' },
    { id: 'decisions-build', phase: 'merge', d: 'M317 157 V182 H251 V211' },
    { id: 'map-output', phase: 'finish', d: 'M129 267 V291 H190 V315' },
    { id: 'build-output', phase: 'finish', d: 'M251 267 V291 H190 V315' },
  ],
}

function NetworkSvg({ layout, variant }: { layout: Layout; variant: 'desktop' | 'mobile' }) {
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
          <rect className="complex-map__highlight" width={node.w} height={node.h} rx={5} />
          <text className="complex-map__label" x={13} y={node.h / 2 - 5}>{node.label}</text>
          <text className="complex-map__title" x={13} y={node.h / 2 + 18}>{node.title}</text>
        </g>
      ))}
    </svg>
  )
}

/** The electrical trace loops on its own; the scroll timeline never touches it. */
export default function HeroNetwork() {
  return (
    <div className="complex-map" aria-hidden="true">
      <span className="complex-map__grid" />
      <NetworkSvg layout={desktop} variant="desktop" />
      <NetworkSvg layout={mobile} variant="mobile" />
    </div>
  )
}
