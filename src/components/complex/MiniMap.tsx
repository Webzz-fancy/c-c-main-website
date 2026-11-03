import type { ComplexProduct, ComplexProject, ComplexStop } from '../../content/complex'

/**
 * Card-sized drawings for the project index. A reader sees the shape of the
 * work before reading a word, and each kind of work has its own shape: experts
 * matched to a project, stages cleared before a match, what each role can
 * reach, a client's app beside the owner's numbers, a pipeline of statuses, a
 * funnel, a path to membership, or the channels that feed one page. The six
 * stop U is kept for the project sheet's overview.
 */

const W = 100
const H = 44

// The six stops run along the top, turn down, and come back along the bottom,
// the same U the full workflow maps use.
const U: [number, number][] = [
  [16, 26], [130, 26], [244, 26],
  [244, 118], [130, 118], [16, 118],
]
const U_WIRES = ['M116 48 H130', 'M230 48 H244', 'M294 70 V118', 'M244 140 H230', 'M130 140 H116']

function Chip({ x, y, w = W, h = H, index, title, tone }: {
  x: number; y: number; w?: number; h?: number; index?: string; title: string; tone: 'near' | 'far' | 'hub'
}) {
  return (
    <g className={`complex-mini__chip complex-mini__chip--${tone}`} transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={5} />
      {index && <text className="complex-mini__index" x={10} y={16}>{index}</text>}
      <text className="complex-mini__title" x={10} y={index ? 33 : h / 2 + 4}>{title}</text>
    </g>
  )
}

export function StopsMiniMap({ stops }: { stops: ComplexStop[] }) {
  return (
    <svg className="complex-mini" viewBox="0 0 360 188" aria-hidden="true" focusable="false">
      {U_WIRES.map((d) => <path key={d} className="complex-mini__wire" d={d} />)}
      {stops.slice(0, 6).map((stop, i) => (
        <Chip key={stop.node} x={U[i][0]} y={U[i][1]} index={`0${i + 1}`} title={stop.node} tone={stop.side} />
      ))}
    </svg>
  )
}

export function ChannelsMiniMap({ product }: { product: ComplexProduct }) {
  const rows = [22, 76, 130]
  return (
    <svg className="complex-mini" viewBox="0 0 360 188" aria-hidden="true" focusable="false">
      {rows.map((y) => <path key={y} className="complex-mini__wire" d={`M124 ${y + 18} H135 V94 H146`} />)}
      <path className="complex-mini__wire complex-mini__wire--lead" d="M246 94 H258" />
      {product.sources.map((source, i) => (
        <Chip key={source} x={14} y={rows[i]} w={110} h={36} title={source} tone="far" />
      ))}
      <Chip x={146} y={70} w={100} h={48} title={product.hub} tone="hub" />
      <Chip x={258} y={76} w={88} h={36} title={product.destination} tone="near" />
    </svg>
  )
}

const Label = ({ x, y, children, anchor = 'start' }: { x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end' }) => (
  <text className="complex-mini__label" x={x} y={y} textAnchor={anchor}>{children}</text>
)

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg className="complex-mini" viewBox="0 0 360 188" aria-hidden="true" focusable="false">{children}</svg>
)

// Experts on either side; the system matches three to the project and only
// they are invited to bid.
function MatchMap() {
  const rows = [10, 66, 122]
  const matched = [[true, false, true], [false, true, false]]
  return (
    <Svg>
      {rows.map((y, i) => (
        <g key={y}>
          <path className={`complex-mini__wire${matched[0][i] ? '' : ' complex-mini__wire--faint'}`} d={`M94 ${y + 18} H112 V84 H130`} />
          <path className={`complex-mini__wire${matched[1][i] ? '' : ' complex-mini__wire--faint'}`} d={`M266 ${y + 18} H248 V84 H230`} />
          <Chip x={14} y={y} w={80} h={36} title="Expert" tone={matched[0][i] ? 'far' : 'near'} />
          <Chip x={266} y={y} w={80} h={36} title="Expert" tone={matched[1][i] ? 'far' : 'near'} />
        </g>
      ))}
      <Chip x={130} y={60} w={100} h={48} index="MATCHED" title="Project" tone="hub" />
      <Label x={180} y={180} anchor="middle">3 matched · invited to bid</Label>
    </Svg>
  )
}

// Seven stages every teacher clears, then a match with the right student.
function StagesMap() {
  return (
    <Svg>
      <Label x={14} y={16}>Seven stages</Label>
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i} className={i === 6 ? 'complex-mini__step complex-mini__step--done' : 'complex-mini__step'} transform={`translate(${14 + i * 48} 26)`}>
          {i < 6 && <path className="complex-mini__wire" d="M32 16 H48" />}
          <rect width={32} height={32} rx={6} />
          <text x={16} y={20.5} textAnchor="middle">{i + 1}</text>
        </g>
      ))}
      <path className="complex-mini__wire complex-mini__wire--lead" d="M318 58 V84 H95 V112" />
      <Chip x={30} y={112} w={130} h={46} index="VETTED" title="Teacher" tone="near" />
      <path className="complex-mini__wire complex-mini__wire--lead" d="M160 135 H200" />
      <Chip x={200} y={112} w={130} h={46} index="MATCHED" title="Student" tone="far" />
    </Svg>
  )
}

// Three roles, three views: the office reaches everything, teachers their
// classes, families only the registration page.
function RolesMap() {
  const roles = [
    { title: 'Office', open: 5 },
    { title: 'Teachers', open: 3 },
    { title: 'Families', open: 1 },
  ]
  return (
    <Svg>
      {roles.map((role, i) => {
        const x = 14 + i * 116
        return (
          <g key={role.title} className="complex-mini__window" transform={`translate(${x} 16)`}>
            <rect className="complex-mini__window-frame" width={100} height={156} rx={8} />
            <path className="complex-mini__window-bar" d="M0 30 H100" />
            <text className="complex-mini__title" x={10} y={20}>{role.title}</text>
            {Array.from({ length: 5 }, (_, row) => (
              <rect
                key={row}
                className={row < role.open ? 'complex-mini__bar' : 'complex-mini__bar complex-mini__bar--locked'}
                x={10}
                y={42 + row * 22}
                width={row % 2 ? 62 : 80}
                height={10}
                rx={3}
              />
            ))}
          </g>
        )
      })}
    </Svg>
  )
}

// The client's app on the left, the owner's live numbers on the right.
function PhoneMap() {
  const items = ['Booked', 'Reminder', 'Follow up', 'Review']
  const bars = [46, 70, 38, 88, 62, 96]
  return (
    <Svg>
      <g className="complex-mini__window" transform="translate(22 8)">
        <rect className="complex-mini__window-frame" width={108} height={172} rx={18} />
        <rect className="complex-mini__notch" x={40} y={8} width={28} height={5} rx={2.5} />
        {items.map((item, i) => (
          <g key={item} transform={`translate(12 ${30 + i * 34})`}>
            <rect className={i === 2 ? 'complex-mini__pill complex-mini__pill--on' : 'complex-mini__pill'} width={84} height={26} rx={7} />
            <circle className="complex-mini__dot" cx={12} cy={13} r={3.5} />
            <text className="complex-mini__small" x={22} y={17}>{item}</text>
          </g>
        ))}
      </g>
      <path className="complex-mini__wire complex-mini__wire--lead" d="M130 94 H156" />
      <g className="complex-mini__window" transform="translate(156 30)">
        <rect className="complex-mini__window-frame" width={190} height={128} rx={10} />
        <text className="complex-mini__title" x={12} y={22}>Owner dashboard</text>
        <path className="complex-mini__window-bar" d="M0 32 H190" />
        {bars.map((h, i) => (
          <rect key={i} className={i === 5 ? 'complex-mini__bar complex-mini__bar--gold' : 'complex-mini__bar'} x={16 + i * 28} y={116 - h * 0.7} width={18} height={h * 0.7} rx={3} />
        ))}
      </g>
    </Svg>
  )
}

// One pipeline of statuses; each move assigns the next person.
function PipelineMap() {
  const columns = [
    { title: 'REVIEW', cards: 3 },
    { title: 'ONBOARD', cards: 2 },
    { title: 'QUOTE', cards: 2, moving: 0 },
    { title: 'DONE', cards: 3 },
  ]
  return (
    <Svg>
      {columns.map((col, i) => {
        const x = 12 + i * 86
        return (
          <g key={col.title} transform={`translate(${x} 12)`}>
            <rect className="complex-mini__column" width={78} height={164} rx={8} />
            <text className="complex-mini__small complex-mini__small--caps" x={10} y={20}>{col.title}</text>
            {Array.from({ length: col.cards }, (_, c) => (
              <g key={c} transform={`translate(8 ${32 + c * 40})`}>
                <rect className={col.moving === c ? 'complex-mini__card complex-mini__card--on' : 'complex-mini__card'} width={62} height={32} rx={5} />
                <rect className="complex-mini__bar" x={8} y={9} width={38} height={5} rx={2} />
                <rect className="complex-mini__bar complex-mini__bar--soft" x={8} y={19} width={26} height={4} rx={2} />
              </g>
            ))}
            {i < 3 && <path className="complex-mini__wire complex-mini__wire--lead" d="M78 48 H86" />}
          </g>
        )
      })}
    </Svg>
  )
}

// Every visitor enters at the top; the funnel narrows to paid, delivered members.
function FunnelMap() {
  const bands = ['Landing page', 'Quiz', '5 result types', 'Payment', 'Delivery']
  return (
    <Svg>
      {bands.map((band, i) => {
        const w = 330 - i * 58
        const x = 180 - w / 2
        const y = 12 + i * 34
        return (
          <g key={band} className={i === 2 ? 'complex-mini__band complex-mini__band--on' : 'complex-mini__band'}>
            <path d={`M${x} ${y} H${x + w} L${x + w - 29} ${y + 30} H${x + 29} Z`} />
            <text className="complex-mini__title" x={180} y={y + 20} textAnchor="middle">{band}</text>
          </g>
        )
      })}
    </Svg>
  )
}

// A path from the waitlist to a welcomed member.
function PathMap() {
  const points: [number, number, string][] = [[30, 150, 'Waitlist'], [98, 122, 'Apply'], [166, 96, 'Approve'], [234, 70, 'Pay']]
  return (
    <Svg>
      <path className="complex-mini__wire complex-mini__wire--lead" d="M30 150 C60 150 70 122 98 122 S140 96 166 96 S208 70 234 70 S262 50 272 50" />
      {points.map(([x, y, label]) => (
        <g key={label}>
          <circle className="complex-mini__milestone" cx={x} cy={y} r={7} />
          <text className="complex-mini__small" x={x} y={y + 24} textAnchor="middle">{label}</text>
        </g>
      ))}
      <Chip x={272} y={28} w={76} h={44} index="MEMBER" title="Welcome" tone="hub" />
    </Svg>
  )
}

// A visitor's way in: found in search or an AI answer, down the page one
// step at a time, out to an order.
function JourneyMap() {
  const rows = ['The story', 'Close look', 'The facts', 'Order']
  const stages = ['Drawn in', 'Sees', 'Decides']
  return (
    <Svg>
      <Label x={14} y={30}>Finds</Label>
      <path className="complex-mini__wire" d="M100 58 H134" />
      <path className="complex-mini__wire" d="M100 129 H111 V58" />
      <Chip x={14} y={41} w={86} h={34} title="Search" tone="far" />
      <Chip x={14} y={112} w={86} h={34} title="AI answer" tone="far" />
      <g className="complex-mini__window" transform="translate(122 10)">
        <rect className="complex-mini__window-frame" width={124} height={168} rx={10} />
        <path className="complex-mini__window-bar" d="M0 24 H124" />
        {[12, 21, 30].map((cx) => <circle key={cx} className="complex-mini__notch" cx={cx} cy={12} r={2.5} />)}
        {rows.map((row, i) => (
          <g key={row} transform={`translate(12 ${36 + i * 34})`}>
            {i > 0 && <path className="complex-mini__wire" d="M50 -10 V0" />}
            <rect className={i === 3 ? 'complex-mini__pill complex-mini__pill--on' : 'complex-mini__pill'} width={100} height={24} rx={7} />
            <circle className="complex-mini__dot" cx={12} cy={12} r={3.5} />
            <text className="complex-mini__small" x={22} y={16}>{row}</text>
          </g>
        ))}
      </g>
      {stages.map((stage, i) => <Label key={stage} x={258} y={61 + i * 34}>{stage}</Label>)}
      <path className="complex-mini__wire complex-mini__wire--lead" d="M234 160 H262" />
      <Chip x={262} y={138} w={86} h={44} index="NEXT STEP" title="Enquiry" tone="hub" />
    </Svg>
  )
}

const VISUALS = { match: MatchMap, stages: StagesMap, roles: RolesMap, phone: PhoneMap, pipeline: PipelineMap, funnel: FunnelMap, path: PathMap, journey: JourneyMap }

export function ProjectVisual({ project }: { project: ComplexProject }) {
  const Visual = VISUALS[project.visual]
  return <Visual />
}
