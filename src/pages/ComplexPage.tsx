import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import HeroNetwork from '../components/complex/HeroNetwork'
import ProjectDetail from '../components/complex/ProjectDetail'
import AgentOffice from '../components/complex/AgentOffice'
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

  // arriving from the header's "AI agent office" link
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
  // the agent office's kind of business; naming one in the search sets it too
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

  const cards = [
    ...COMPLEX.projects.map((project) => ({
      id: project.id,
      card: (
        <a className="complex-card" href={`#project-${project.id}`} onClick={show(project.id)} aria-haspopup="dialog">
          <span className="complex-card__visual"><ProjectVisual project={project} /></span>
          <span className="complex-card__meta">
            <span>{project.card.kind}</span>
            <span>{project.card.area}</span>
          </span>
          <h3>{project.card.name}</h3>
          <span className="complex-card__shift">
            <span className="complex-card__before"><b>Before</b>{project.card.before}</span>
            <span className="complex-card__after"><b>Now</b>{project.card.after}</span>
          </span>
          <span className="complex-card__users"><b>Who uses it</b> {project.card.users}</span>
          <span className="complex-card__go">See the details <span aria-hidden="true">→</span></span>
        </a>
      ),
    })),
    {
      id: COMPLEX.discoverability.id,
      card: (
        <a className="complex-card complex-card--product" href={COMPLEX.discoverability.url} target="_blank" rel="noopener">
          <span className="complex-card__visual"><ChannelsMiniMap product={COMPLEX.discoverability} /></span>
          <span className="complex-card__meta">
            <span>AI discoverability</span>
            <span>{COMPLEX.discoverability.sector}</span>
          </span>
          <h3>{COMPLEX.discoverability.name}</h3>
          <span className="complex-card__shift">
            <span className="complex-card__before"><b>Before</b>{COMPLEX.discoverability.before}</span>
            <span className="complex-card__after"><b>Now</b>{COMPLEX.discoverability.after}</span>
          </span>
          <span className="complex-card__users"><b>Who uses it</b> {COMPLEX.discoverability.users}</span>
          <span className="complex-card__go">{COMPLEX.discoverability.action} <span aria-hidden="true">↗</span></span>
        </a>
      ),
    },
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
              <p className="complex-eyebrow">{COMPLEX.hero.label}</p>
              <h1>{COMPLEX.hero.firstLine}{' '}<em>{COMPLEX.hero.secondLine}</em></h1>
              <ProjectFinder onMatch={onMatch} />
            </div>
            <HeroNetwork focus={found?.need ?? (found?.industry ? 'agents' : null)} />
          </div>
        </section>

        <AgentOffice industry={industry} onIndustry={setIndustry} />

        {/* The proof first: every project on one screen. A drawing of the
            work, the kind of business, and how it ran before and now, so a
            reader can find their own problem before opening anything. */}
        <section id="complex-index" className="complex-index" aria-labelledby="complex-index-title">
          <div className="complex-index__head" data-complex-reveal>
            <p className="complex-eyebrow">02 / {COMPLEX.index.label}</p>
            <h2 id="complex-index-title">{COMPLEX.index.heading}</h2>
            <p className="complex-index__intro">{COMPLEX.index.intro}</p>
            <div className="complex-start">
              <p className="complex-start__label">{COMPLEX.index.start.label}</p>
              <ul>
                {COMPLEX.index.start.items.map((item) => (
                  <li key={item.offer}>
                    <a href={item.href} {...external(item.href)}>
                      <span>{item.need}</span>
                      <b>{item.offer} <span aria-hidden="true">{item.href.startsWith('#') ? '↓' : '↗'}</span></b>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ol id="complex-grid" className="complex-index__grid" data-filtered={found && !found.none ? '' : undefined}>
            {ordered.map(({ id, card }) => (
              <li key={id} data-match={rank(id)}>
                {card}
              </li>
            ))}
          </ol>
        </section>

        <section className="complex-close" aria-labelledby="complex-close-title">
          <div className="complex-close__inner" data-complex-reveal>
            <div className="complex-close__text">
              <p className="complex-eyebrow">03 / {COMPLEX.close.label}</p>
              <h2 id="complex-close-title">{COMPLEX.close.heading}</h2>
              <p>{COMPLEX.close.body}</p>
              <p className="complex-close__lead">{COMPLEX.close.quiz}</p>
              <a className="complex-close__quiz" href={QUIZ} {...external(QUIZ)}>
                Take the business quiz <span aria-hidden="true">→</span>
              </a>
            </div>
            {/* The robot stands to the right of the invitation and rests its
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
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ProjectDetail project={openProject} onClose={close} />
    </div>
  )
}
