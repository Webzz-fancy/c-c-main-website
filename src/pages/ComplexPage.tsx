import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import HeroNetwork from '../components/complex/HeroNetwork'
import ProjectDetail from '../components/complex/ProjectDetail'
import AgentLab, { AgentsVisual } from '../components/complex/AgentLab'
import ProjectFinder, { type FinderMatch } from '../components/complex/ProjectFinder'
import { ProjectVisual, ChannelsMiniMap } from '../components/complex/MiniMap'
import { COMPLEX } from '../content/complex'
import { BookButton, QUIZ, external } from '../components/complex/cta'
import './complex.css'

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Section reveals scrub with the reader's scroll. The hero loop keeps its own
 * independent schedule.
 */
function useComplexScroll(ref: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-complex-reveal]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let active = true

    const draw = () => {
      frame = 0
      if (motion.matches) {
        reveals.forEach((el) => el.style.setProperty('--reveal', '1'))
        return
      }
      const vh = window.innerHeight
      reveals.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const enter = clamp01((vh * 0.92 - rect.top) / Math.min(vh * 0.42, 390))
        el.style.setProperty('--reveal', enter.toFixed(3))
        el.style.setProperty('--reveal-y', `${((1 - enter) * 27).toFixed(1)}px`)
      })
    }

    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw) }
    const preference = () => {
      root.dataset.complexMotion = motion.matches ? 'off' : 'on'
      schedule()
    }

    root.dataset.complexMotion = motion.matches ? 'off' : 'on'
    draw()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', preference)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', preference)
    }
  }, [ref])
}

const projectFromHash = (hash: string) =>
  COMPLEX.projects.find((project) => `#project-${project.id}` === hash) ?? null

export default function ComplexPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useComplexScroll(rootRef)

  // A project's details open over the page. Its address (#project-…) can be
  // shared, and opening that address opens the same details.
  const [openId, setOpenId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : projectFromHash(window.location.hash)?.id ?? null,
  )
  const openProject = COMPLEX.projects.find((project) => project.id === openId) ?? null

  const show = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    window.history.replaceState(window.history.state, '', `#project-${id}`)
    setOpenId(id)
  }

  const close = useCallback(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    setOpenId(null)
  }, [])

  // arriving from the header's "AI agents" link
  useEffect(() => {
    if (window.location.hash !== '#agents') return
    const id = window.setTimeout(() => document.getElementById('agents')?.scrollIntoView({ block: 'start' }), 80)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const onHash = () => setOpenId(projectFromHash(window.location.hash)?.id ?? null)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // the finder's answer: matching projects come first, closest first, and
  // the rest stay on the page behind them
  const [found, setFound] = useState<FinderMatch | null>(null)
  // the agents' kind of business; naming one in the search sets it too
  const [industry, setIndustry] = useState<string | null>(null)
  const onMatch = (match: FinderMatch | null) => {
    setFound(match)
    if (match?.industry) setIndustry(match.industry)
  }
  const rank = (id: string) => {
    if (!found || found.none) return undefined
    const at = found.ids.indexOf(id)
    return at === -1 ? 'no' : at === 0 ? 'best' : 'yes'
  }

  // the slider: which way there is more to see, and a step of one card
  const trackRef = useRef<HTMLOListElement>(null)
  const [slide, setSlide] = useState({ back: false, next: true })
  const read = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setSlide({ back: track.scrollLeft > 4, next: track.scrollLeft + track.clientWidth < track.scrollWidth - 4 })
  }, [])
  const move = (way: 1 | -1) => {
    const track = trackRef.current
    const first = track?.firstElementChild as HTMLElement | null
    if (!track || !first) return
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0')
    track.scrollBy({ left: way * step, behavior: 'smooth' })
  }
  useEffect(() => {
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [read])
  // a new answer from the finder: back to the first, closest match
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
    read()
  }, [found, read])

  // the agents section sits under the slider; its card leads the slider and goes down to it
  const toAgents = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // AI work leads the slider: the agents, then AI discoverability
  const cards = [
    {
      id: 'agents',
      card: (
        <a className="complex-card complex-card--agents" href="#agents" onClick={toAgents}>
          <span className="complex-card__visual"><AgentsVisual /></span>
          <span className="complex-card__kind">{COMPLEX.index.agents.kind}</span>
          <h3>{COMPLEX.index.agents.name}</h3>
          <p className="complex-card__change">{COMPLEX.index.agents.change}</p>
          <span className="complex-card__go">{COMPLEX.index.agents.action} <span aria-hidden="true">↓</span></span>
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
        <a className="complex-card" href={`#project-${project.id}`} onClick={show(project.id)} aria-haspopup="dialog">
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

  return (
    <div ref={rootRef} className="complex-page">
      <Header />
      <ScrollRope />
      <main>
        <section id="complex-hero" className="complex-hero">
          <div className="complex-hero__texture" aria-hidden="true" />
          <div className="complex-hero__inner">
            <div className="complex-hero__copy">
              <h1>{COMPLEX.hero.firstLine}{' '}<em>{COMPLEX.hero.secondLine}</em></h1>
              <p className="complex-hero__intro">{COMPLEX.hero.intro}</p>
              <ProjectFinder onMatch={onMatch} />
            </div>
            <HeroNetwork focus={found?.need ?? (found?.industry ? 'agents' : null)} />
          </div>
        </section>

        {/* The work we have built, AI first: a drawing of each, its name, and
            what it changed. The agents' card leads down to their section. */}
        <section id="complex-index" className="complex-index" aria-labelledby="complex-index-title">
          <div className="complex-index__head" data-complex-reveal>
            <p className="complex-eyebrow">01 / {COMPLEX.index.label}</p>
            <h2 id="complex-index-title">{COMPLEX.index.heading}</h2>
            <p className="complex-index__intro">{COMPLEX.index.intro}</p>
          </div>
          {/* the projects slide sideways, a few at a time; arrows on both sides say so */}
          <div className="complex-slider">
            <ol ref={trackRef} id="complex-grid" className="complex-index__grid" data-filtered={found && !found.none ? '' : undefined} onScroll={read}>
              {ordered.map(({ id, card }) => (
                <li key={id} data-match={rank(id)}>
                  {card}
                </li>
              ))}
            </ol>
            <button type="button" className="complex-slider__arrow complex-slider__arrow--back" aria-label="Previous projects" aria-controls="complex-grid" disabled={!slide.back} onClick={() => move(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="complex-slider__arrow complex-slider__arrow--next" aria-label="Next projects" aria-controls="complex-grid" disabled={!slide.next} onClick={() => move(1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>

        <AgentLab industry={industry ?? 'any'} onIndustry={setIndustry} />

        <section className="complex-close" aria-labelledby="complex-close-title">
          <div className="complex-close__inner" data-complex-reveal>
            <div className="complex-close__text">
              <p className="complex-eyebrow">03 / {COMPLEX.close.label}</p>
              <h2 id="complex-close-title">{COMPLEX.close.heading}</h2>
              <p>{COMPLEX.close.body}</p>
            </div>
            {/* Both ways forward on one line under the copy. The robot rests its
                hand on the button, the way you would lean on a counter. */}
            <div className="complex-close__actions">
              <span className="complex-close__button">
                <BookButton label={COMPLEX.close.action} />
                <img
                  className="complex-close__robot"
                  src="/robot-leaning.webp"
                  alt=""
                  aria-hidden="true"
                  width={302}
                  height={533}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <p className="complex-close__lead">
                {COMPLEX.close.quiz}{' '}
                <a className="complex-close__quiz" href={QUIZ} {...external(QUIZ)}>
                  Get your business fix plan <span aria-hidden="true">→</span>
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ProjectDetail project={openProject} onClose={close} />
    </div>
  )
}
