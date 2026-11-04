import { useCallback, useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { AgentsVisual } from './AgentLab'
import { ProjectVisual, ChannelsMiniMap } from './MiniMap'
import type { FinderMatch } from './ProjectFinder'
import { COMPLEX } from '../../content/complex'

type Props = {
  /** where the project pages live: '' on /projects itself, '/projects' elsewhere */
  base?: string
  /** the finder's answer, which brings the closest work to the front */
  found?: FinderMatch | null
  /** opens a project's details in place; without it, cards link to /projects */
  onOpen?: (id: string) => (e: MouseEvent<HTMLAnchorElement>) => void
  /** the agents' card scrolls to their section when it is on the same page */
  onAgents?: (e: MouseEvent<HTMLAnchorElement>) => void
  id?: string
}

/**
 * The work we have built, as glass cards on an endless slider, AI first. The
 * projects page and the home page share it: on /projects a card opens the
 * details over the page, anywhere else it goes to the same details there.
 */
export default function ProjectSlider({ base = '', found = null, onOpen, onAgents, id = 'complex-grid' }: Props) {
  const rank = (cardId: string) => {
    if (!found || found.none) return undefined
    const at = found.ids.indexOf(cardId)
    return at === -1 ? 'no' : at === 0 ? 'best' : 'yes'
  }

  // The slider has no ends. The cards are laid out three times over and the
  // reader starts on the middle set; whenever they settle near either copy,
  // the track jumps by one whole set, which shows exactly the same cards, so
  // the scroll carries on for ever in both directions.
  const trackRef = useRef<HTMLOListElement>(null)
  const setWidth = useCallback(() => {
    const track = trackRef.current
    const n = track ? track.children.length / 3 : 0
    if (!track || !n) return 0
    return (track.children[n] as HTMLElement).offsetLeft - (track.children[0] as HTMLElement).offsetLeft
  }, [])
  const recenter = useCallback(() => {
    const track = trackRef.current
    const set = setWidth()
    if (!track || !set) return
    if (track.scrollLeft < set * 0.5) track.scrollTo({ left: track.scrollLeft + set, behavior: 'instant' })
    else if (track.scrollLeft >= set * 1.5) track.scrollTo({ left: track.scrollLeft - set, behavior: 'instant' })
  }, [setWidth])
  const settle = useRef(0)
  const aim = useRef<number | null>(null)
  const aimed = useRef(0)
  // once the track comes to rest: the browser says so where it can, and
  // elsewhere a short pause in scrolling stands in for it
  const rest = useCallback(() => {
    aim.current = null
    recenter()
  }, [recenter])
  const scrollEnd = typeof window !== 'undefined' && 'onscrollend' in window
  const onTrackScroll = () => {
    if (scrollEnd) return
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(rest, 140)
  }
  useEffect(() => {
    const track = trackRef.current
    if (!track || !scrollEnd) return
    track.addEventListener('scrollend', rest)
    return () => track.removeEventListener('scrollend', rest)
  }, [rest, scrollEnd])
  // the light on the glass follows the pointer across the card under it
  const followPointer = (e: PointerEvent<HTMLOListElement>) => {
    const card = (e.target as Element).closest<HTMLElement>('.complex-card')
    if (!card) return
    const box = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - box.left}px`)
    card.style.setProperty('--my', `${e.clientY - box.top}px`)
  }
  // each press aims at the next whole card from where the last press was
  // going, so quick presses add up instead of being lost mid-slide
  const move = (way: 1 | -1) => {
    const track = trackRef.current
    const first = track?.firstElementChild as HTMLElement | null
    if (!track || !first) return
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0')
    // a target only counts while its slide is still running
    if (aim.current !== null && performance.now() - aimed.current > 700) aim.current = null
    if (aim.current === null) recenter()
    const from = aim.current ?? track.scrollLeft
    const left = (Math.round(from / step) + way) * step
    aim.current = left
    aimed.current = performance.now()
    track.scrollTo({ left, behavior: 'smooth' })
  }
  // start on the middle set, and come back to its first card, the closest
  // match, whenever the finder answers or the page is resized
  const toStart = useCallback(() => {
    trackRef.current?.scrollTo({ left: setWidth(), behavior: 'instant' })
  }, [setWidth])
  useEffect(() => {
    toStart()
    window.addEventListener('resize', toStart)
    return () => window.removeEventListener('resize', toStart)
  }, [toStart])
  useEffect(toStart, [found, toStart])

  // AI work leads the slider: the agents, then AI discoverability
  const cards = [
    {
      id: 'agents',
      card: (
        <a className="complex-card complex-card--agents" href={`${base}#agents`} onClick={onAgents}>
          <span className="complex-card__visual"><AgentsVisual /></span>
          <span className="complex-card__kind">{COMPLEX.index.agents.kind}</span>
          <h3>{COMPLEX.index.agents.name}</h3>
          <p className="complex-card__change">{COMPLEX.index.agents.change}</p>
          <span className="complex-card__go">{COMPLEX.index.agents.action} <span aria-hidden="true">{base ? '→' : '↓'}</span></span>
        </a>
      ),
    },
    {
      id: COMPLEX.discoverability.id,
      card: (
        <a className="complex-card complex-card--product" href={COMPLEX.discoverability.url} target="_blank" rel="noopener">
          <span className="complex-card__visual"><ChannelsMiniMap product={COMPLEX.discoverability} /></span>
          <span className="complex-card__kind">{COMPLEX.discoverability.kind}</span>
          <h3>{COMPLEX.discoverability.name}</h3>
          <p className="complex-card__change">{COMPLEX.discoverability.after}</p>
          <span className="complex-card__go">{COMPLEX.discoverability.action} <span aria-hidden="true">↗</span></span>
        </a>
      ),
    },
    ...COMPLEX.projects.map((project) => ({
      id: project.id,
      card: (
        <a
          className="complex-card"
          href={`${base}#project-${project.id}`}
          onClick={onOpen?.(project.id)}
          aria-haspopup={onOpen ? 'dialog' : undefined}
        >
          <span className="complex-card__visual"><ProjectVisual project={project} /></span>
          <span className="complex-card__kind">{project.card.kind}</span>
          <h3>{project.card.name}</h3>
          <p className="complex-card__change">{project.card.after}</p>
          <span className="complex-card__go">See the details <span aria-hidden="true">→</span></span>
        </a>
      ),
    })),
  ]
  const ordered = found && !found.none
    ? [...cards].sort((x, y) => {
        const a = found.ids.indexOf(x.id)
        const b = found.ids.indexOf(y.id)
        return (a === -1 ? 99 : a) - (b === -1 ? 99 : b)
      })
    : cards

  // the copies before and after the real set are there only to loop into,
  // so they are hidden from screen readers and the keyboard
  return (
    <div className="complex-slider">
      <ol ref={trackRef} id={id} className="complex-index__grid" data-filtered={found && !found.none ? '' : undefined} onScroll={onTrackScroll} onPointerMove={followPointer}>
        {[0, 1, 2].flatMap((copy) =>
          ordered.map(({ id: cardId, card }, i) => (
            <li
              key={`${copy}-${cardId}`}
              data-match={rank(cardId)}
              style={{ '--n': `"${String(i + 1).padStart(2, '0')}"` } as CSSProperties}
              ref={copy === 1 ? undefined : (el) => el?.setAttribute('inert', '')}
              aria-hidden={copy === 1 ? undefined : true}
            >
              {card}
            </li>
          )),
        )}
      </ol>
      <button type="button" className="complex-slider__arrow complex-slider__arrow--back" aria-label="Previous projects" aria-controls={id} onClick={() => move(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" className="complex-slider__arrow complex-slider__arrow--next" aria-label="Next projects" aria-controls={id} onClick={() => move(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  )
}
