import { useEffect, useRef, useState, type RefObject } from 'react'
import { COMPLEX, type ComplexStoryStep } from '../../content/complex'
import { BookButton } from './cta'

/**
 * The AI agent office, drawn as a floor: the director at the head of the
 * room, a desk per team with its agent at work, and the short queue of what
 * is waiting on the owner. Work travels along the wires; an agent types,
 * files a report or raises a hand. With reduced motion the floor holds still.
 * A visitor can pick their kind of business and the floor is set up for it,
 * then watch one job go through it, step by step, at the level of control
 * each step runs at.
 */

type State = 'working' | 'reported' | 'needs-you'
type Team = { name: string; job: string; state: State }

const W = 1200
const DESK_H = 142
const DESK_Y = 196
const DESK_GAP = 17
// the desks share the floor's width, however many teams there are
const deskW = (n: number) => (W - 48 - DESK_GAP * (n - 1)) / n
const deskX = (n: number, i: number) => 24 + i * (deskW(n) + DESK_GAP)
const deskCentre = (n: number, i: number) => deskX(n, i) + deskW(n) / 2
// a picked business's desks: busy, reporting, busy, waiting on you
const STATES: State[] = ['working', 'reported', 'working', 'needs-you', 'working']

function Robot({ x, y, lead = false }: { x: number; y: number; lead?: boolean }) {
  return (
    <g className={lead ? 'agents-robot agents-robot--lead' : 'agents-robot'} transform={`translate(${x} ${y})`} aria-hidden="true">
      <path className="agents-robot__antenna" d="M15 0 V6" />
      <circle className="agents-robot__tip" cx={15} cy={0} r={2.4} />
      <rect className="agents-robot__head" y={6} width={30} height={24} rx={8} />
      <circle className="agents-robot__eye" cx={10} cy={18} r={2.6} />
      <circle className="agents-robot__eye" cx={20} cy={18} r={2.6} />
    </g>
  )
}

function Status({ state }: { state: 'working' | 'reported' | 'needs-you' }) {
  if (state === 'working') {
    return (
      <g className="agents-status agents-status--working">
        <rect width={92} height={24} rx={12} />
        <text x={12} y={16}>Working</text>
        <circle className="agents-dot" cx={68} cy={12} r={2.2} />
        <circle className="agents-dot" cx={75} cy={12} r={2.2} />
        <circle className="agents-dot" cx={82} cy={12} r={2.2} />
      </g>
    )
  }
  if (state === 'reported') {
    return (
      <g className="agents-status agents-status--reported">
        <rect width={104} height={24} rx={12} />
        <path d="M12 12.5 l4 4 l8 -9" />
        <text x={30} y={16}>Report filed</text>
      </g>
    )
  }
  return (
    <g className="agents-status agents-status--needs">
      <rect width={96} height={24} rx={12} />
      <circle cx={14} cy={12} r={6} />
      <text className="agents-status__bang" x={14} y={15.5} textAnchor="middle">!</text>
      <text x={26} y={16}>Needs you</text>
    </g>
  )
}

type At = ComplexStoryStep['at']
const LEVEL = (level: ComplexStoryStep['level']) => level.toLowerCase().replace(/\s+/g, '-')

function OfficeFloor({ teams, queue, at }: { teams: Team[]; queue: string[]; at: At | null }) {
  const { director } = COMPLEX.agents
  const n = teams.length
  const bus = `M${W / 2} 112 V152 M${deskCentre(n, 0)} 152 H${deskCentre(n, n - 1)}`
  const drops = teams.map((_, i) => `M${deskCentre(n, i)} 152 V${DESK_Y}`)
  // reports and requests come back down to the owner's queue
  const toQueue = teams
    .map((team, i) => ({ team, i }))
    .filter(({ team }) => team.state !== 'working')
    .map(({ i }) => `M${deskCentre(n, i)} ${DESK_Y + DESK_H} V372`)

  return (
    <svg className="agents-floor" viewBox={`0 0 ${W} 470`} role="img" aria-labelledby="agents-floor-title">
      <title id="agents-floor-title">
        {`An office of AI agents: a ${director.name.toLowerCase()} over ${teams.length} teams (${teams.map((t) => t.name).join(', ')}), with a queue of what is waiting on you.`}
      </title>
      <defs>
        <pattern id="agents-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0 H0 V28" className="agents-grid" />
        </pattern>
      </defs>
      <rect width={W} height={470} fill="url(#agents-grid)" />

      <path className="agents-wire" d={bus} />
      {drops.map((d) => <path key={d} className="agents-wire" d={d} />)}
      {toQueue.map((d) => <path key={d} className="agents-wire agents-wire--back" d={d} />)}

      {/* work leaving the director for each desk, and coming back */}
      {drops.map((d, i) => (
        <circle key={`out-${d}`} className="agents-packet" r={3.6}>
          <animateMotion dur="3.6s" begin={`${i * 0.7}s`} repeatCount="indefinite" path={`M${W / 2} 112 V152 H${deskCentre(n, i)} V${DESK_Y}`} />
        </circle>
      ))}
      {toQueue.map((d, i) => (
        <circle key={`back-${d}`} className="agents-packet agents-packet--back" r={3.6}>
          <animateMotion dur="2.4s" begin={`${1.2 + i * 1.1}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}

      <g className="agents-spot" data-active={at === 'director' ? '' : undefined} transform={`translate(${W / 2 - 150} 24)`}>
        <rect className="agents-desk agents-desk--lead" width={300} height={88} rx={16} />
        <Robot x={22} y={26} lead />
        <text className="agents-desk__name agents-desk__name--lead" x={70} y={44}>{director.name}</text>
        <text className="agents-desk__job agents-desk__job--lead" x={70} y={64}>{director.job}</text>
      </g>

      {teams.map((team, i) => (
        <g key={team.name} className="agents-team agents-spot" data-state={team.state} data-active={at === i ? '' : undefined} transform={`translate(${deskX(n, i)} ${DESK_Y})`}>
          <rect className="agents-desk" width={deskW(n)} height={DESK_H} rx={14} />
          <Robot x={16} y={16} />
          <text className="agents-desk__name" x={58} y={40}>{team.name}</text>
          {team.job.split(' · ').map((line, l) => (
            <text key={line} className="agents-desk__job" x={16} y={66 + l * 15}>{line}</text>
          ))}
          <g transform={`translate(16 ${DESK_H - 34})`}><Status state={team.state} /></g>
        </g>
      ))}

      <g className="agents-spot" data-active={at === 'you' ? '' : undefined} transform="translate(24 372)">
        <rect className="agents-you" width={232} height={78} rx={14} />
        <circle className="agents-you__face" cx={38} cy={39} r={18} />
        <text className="agents-you__initial" x={38} y={45} textAnchor="middle">You</text>
        <text className="agents-desk__name agents-desk__name--lead" x={66} y={36}>You decide</text>
        <text className="agents-desk__job agents-desk__job--lead" x={66} y={55}>In one short batch a day</text>
      </g>
      <path className="agents-wire agents-wire--back" d="M256 411 H274" />
      <g transform="translate(274 372)">
        <rect className="agents-queue" width={902} height={78} rx={14} />
        <text className="agents-queue__label" x={22} y={28}>{COMPLEX.agents.queue.label.toUpperCase()}</text>
        <text className="agents-queue__count" x={880} y={28} textAnchor="end">{queue.length}</text>
        {queue.map((item, i) => (
          <g key={item} className="agents-spot" data-active={at === 'queue' && i === 0 ? '' : undefined} transform={`translate(${22 + i * 292} 40)`}>
            <rect className="agents-queue__item" width={276} height={26} rx={8} />
            <circle className="agents-queue__dot" cx={14} cy={13} r={3.5} />
            <text className="agents-queue__text" x={26} y={17.5}>{item}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

const STEP_MS = 4200

/**
 * Plays a job through the office one step at a time while the floor is on
 * screen. A visitor can pause it or jump to a step; with reduced motion it
 * waits for them.
 */
function useStory(count: number, root: RefObject<HTMLElement>) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [root])

  useEffect(() => {
    if (!playing || !seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % count), STEP_MS)
    return () => window.clearInterval(id)
  }, [playing, seen, count])

  return { step, setStep, playing, setPlaying }
}

function Office({ teams, queue, story }: { teams: Team[]; queue: string[]; story: ComplexStoryStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { step, setStep, playing, setPlaying } = useStory(story.length, ref)
  const current = story[step]

  return (
    <div ref={ref} className="complex-agents__floor">
      <OfficeFloor teams={teams} queue={queue} at={current.at} />
      <div className="complex-agents__story" data-level={LEVEL(current.level)}>
        <p className="complex-agents__story-label">{COMPLEX.agents.story.label}</p>
        <div className="complex-agents__story-body" aria-live="polite">
          <span className="complex-agents__level">{current.level}</span>
          <p key={step}>{current.text}</p>
        </div>
        <div className="complex-agents__story-nav">
          {story.map((s, i) => (
            <button
              key={s.text}
              type="button"
              className="complex-agents__dot"
              data-level={LEVEL(s.level)}
              aria-current={i === step ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${s.level}`}
              onClick={() => { setStep(i); setPlaying(false) }}
            />
          ))}
          <button type="button" className="complex-agents__play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentOffice({ industry, onIndustry }: { industry: string | null; onIndustry: (id: string | null) => void }) {
  const { agents } = COMPLEX
  const picked = agents.industries.items.find((item) => item.id === industry)
  const teams: Team[] = picked ? picked.teams.map((team, i) => ({ ...team, state: STATES[i] })) : agents.teams
  const queue = picked ? picked.queue : agents.queue.items
  const story = picked ? picked.story : agents.story.steps

  // a pick redraws the floor below the chips; bring it into view
  const floorRef = useRef<HTMLDivElement>(null)
  const pick = (id: string | null) => {
    onIndustry(id)
    const el = floorRef.current
    if (el && el.getBoundingClientRect().bottom > window.innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section id="agents" className="complex-agents" aria-labelledby="complex-agents-title">
      <div className="complex-agents__inner">
        <div className="complex-agents__head">
          <p className="complex-eyebrow">01 / {agents.label}</p>
          <h2 id="complex-agents-title">{agents.heading} <em>{agents.emphasis}</em></h2>
          <p className="complex-agents__intro">{agents.intro}</p>
          <p className="complex-agents__definition">{agents.definition}</p>
        </div>

        <div id="agents-picker" className="complex-agents__picker">
          <h3>{agents.industries.label}</h3>
          <div className="complex-agents__chips" role="group" aria-label={agents.industries.label}>
            {[{ id: null, label: agents.industries.any }, ...agents.industries.items].map((item) => (
              <button
                key={item.id ?? 'any'}
                type="button"
                className="complex-agents__chip"
                aria-pressed={industry === item.id}
                onClick={() => pick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={floorRef}>
          <Office key={industry ?? 'any'} teams={teams} queue={queue} story={story} />
        </div>

        {picked && (
          <div className="complex-agents__plans" aria-live="polite">
            <div className="complex-agents__panel">
              <h3>With clients</h3>
              <ul>{picked.clients.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
            <div className="complex-agents__panel">
              <h3>Behind the scenes</h3>
              <ul>{picked.operations.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          </div>
        )}

        <div className="complex-agents__trust">
          <h3>{agents.control.label}</h3>
          <ol className="complex-agents__levels">
            {agents.control.steps.map((step) => (
              <li key={step.level} data-level={LEVEL(step.level as ComplexStoryStep['level'])}>
                <b>{step.level}</b>
                <span>{step.what}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="complex-agents__setup">
          <h3>{agents.setup.label}</h3>
          <ol>
            {agents.setup.steps.map((step, i) => (
              <li key={step.step}>
                <span className="complex-agents__setup-n">{String(i + 1).padStart(2, '0')}</span>
                <b>{step.step}</b>
                <span>{step.what}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="complex-agents__action">
          <BookButton label={agents.action} />
          <a className="complex-agents__back" href="#agents-picker">Pick your kind of business <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </section>
  )
}
