import { useLayoutEffect, useRef, type RefObject } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import { COMPLEX } from '../content/complex'
import { site } from '../config/site'
import './complex.css'

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Everything on this page follows the reader's scroll position, not a timer.
 * Set CSS variables on the few moving elements in a single rAF; scrolling
 * back reverses every reveal. Ordinary content stays in the document flow.
 */
function useComplexScroll(ref: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const hero = root.querySelector<HTMLElement>('[data-complex-hero]')
    const path = root.querySelector<SVGPathElement>('[data-complex-path]')
    const method = root.querySelector<HTMLElement>('[data-complex-method]')
    const cases = Array.from(root.querySelectorAll<HTMLElement>('[data-complex-case]'))
    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-complex-reveal]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!hero || !path || !method) return

    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    let frame = 0
    let active = true

    const draw = () => {
      frame = 0
      if (motion.matches) return
      const vh = window.innerHeight
      const heroRect = hero.getBoundingClientRect()
      const methodRect = method.getBoundingClientRect()
      const caseRects = cases.map((el) => el.getBoundingClientRect())
      const revealRects = reveals.map((el) => el.getBoundingClientRect())

      const heroP = clamp01(-heroRect.top / Math.max(1, heroRect.height * 0.52))
      path.style.strokeDashoffset = `${(length * (1 - heroP)).toFixed(2)}`
      hero.style.setProperty('--hero-lift', `${((1 - heroP) * 15).toFixed(1)}px`)

      const methodP = clamp01((vh * 0.28 - methodRect.top) / Math.max(1, methodRect.height + vh * 0.35))
      method.style.setProperty('--method-progress', methodP.toFixed(3))

      cases.forEach((el, i) => {
        const rect = caseRects[i]
        const progress = clamp01((vh * 0.68 - rect.top) / Math.max(1, rect.height + vh * 0.35))
        el.style.setProperty('--case-progress', progress.toFixed(3))
        el.querySelectorAll<HTMLElement>('[data-complex-node]').forEach((node, index, list) => {
          node.style.setProperty('--lit', clamp01((progress - index / list.length * 0.78) * list.length * 1.7).toFixed(3))
        })
      })

      reveals.forEach((el, i) => {
        const rect = revealRects[i]
        const enter = clamp01((vh * 0.92 - rect.top) / Math.min(vh * 0.42, 390))
        el.style.setProperty('--reveal', enter.toFixed(3))
        el.style.setProperty('--reveal-y', `${((1 - enter) * 27).toFixed(1)}px`)
      })
    }

    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw) }
    const preference = () => {
      root.dataset.complexMotion = motion.matches ? 'off' : 'on'
      if (motion.matches) {
        path.style.strokeDasharray = ''
        path.style.strokeDashoffset = ''
      } else {
        path.style.strokeDasharray = `${length}`
        schedule()
      }
    }

    root.dataset.complexMotion = motion.matches ? 'off' : 'on'
    draw()
    const observer = new ResizeObserver(schedule)
    observer.observe(hero)
    observer.observe(method)
    cases.forEach((el) => observer.observe(el))
    document.fonts?.ready.then(schedule).catch(() => {})
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', preference)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', preference)
    }
  }, [ref])
}

function HeroMap() {
  return (
    <div className="complex-map" aria-hidden="true">
      <span className="complex-map__grid" />
      <span className="complex-map__seal">A clearer way through</span>
      <svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet" className="complex-map__lines">
        <path className="complex-map__ghost" d="M210 138 H284 V102 H370 M454 144 V254 H310 V326" />
        <path data-complex-path className="complex-map__ink" d="M210 138 H284 V102 H370 M454 144 V254 H310 V326" />
        <circle cx="284" cy="138" r="4" />
        <circle cx="454" cy="254" r="4" />
      </svg>
      <div className="complex-map__note complex-map__note--one">
        <span>01 / NOTICE</span>
        <strong>People</strong>
      </div>
      <div className="complex-map__note complex-map__note--two">
        <span>02 / UNDERSTAND</span>
        <strong>The work</strong>
      </div>
      <div className="complex-map__note complex-map__note--three">
        <span>03 / MAKE SPACE</span>
        <strong>What happens next</strong>
      </div>
    </div>
  )
}

export default function ComplexPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useComplexScroll(rootRef)

  return (
    <div ref={rootRef} className="complex-page">
      <Header />
      <ScrollRope />
      <main>
        <section id="complex-hero" className="complex-hero" data-complex-hero>
          <div className="complex-hero__texture" aria-hidden="true" />
          <div className="complex-hero__inner">
            <div className="complex-hero__copy">
              <p className="complex-eyebrow">{COMPLEX.hero.label}</p>
              <h1>{COMPLEX.hero.firstLine}{' '}<br /><em>{COMPLEX.hero.secondLine}</em></h1>
              <p className="complex-hero__intro">{COMPLEX.hero.intro}</p>
              <a className="complex-link complex-link--brand" href="#complex-approach">
                See the thinking <span aria-hidden="true">↘</span>
              </a>
            </div>
            <HeroMap />
          </div>
          <div className="complex-hero__foot" aria-hidden="true"><span>Scroll to connect the dots</span><span>↓</span></div>
        </section>

        <section id="complex-approach" className="complex-method" data-complex-method aria-labelledby="complex-method-title">
          <div className="complex-method__inner">
            <div className="complex-method__intro" data-complex-reveal>
              <p className="complex-eyebrow">01 / {COMPLEX.method.label}</p>
              <h2 id="complex-method-title">{COMPLEX.method.heading[0]}{' '}<br /><em>{COMPLEX.method.heading[1]}</em></h2>
              <p>{COMPLEX.method.intro}</p>
            </div>
            <div className="complex-method__list">
              <span className="complex-method__track" aria-hidden="true"><span /></span>
              <ol>
                {COMPLEX.method.steps.map((step, i) => (
                  <li key={step.title} data-complex-reveal>
                    <span className="complex-method__number">0{i + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="complex-work" className="complex-work" aria-labelledby="complex-work-title">
          <div className="complex-work__intro" data-complex-reveal>
            <p className="complex-eyebrow">02 / {COMPLEX.work.label}</p>
            <h2 id="complex-work-title">{COMPLEX.work.heading}</h2>
            <p>{COMPLEX.work.intro}</p>
          </div>
          <div className="complex-work__cases">
            {COMPLEX.projects.map((project) => (
              <article key={project.id} className={`complex-case complex-case--${project.id}`} data-complex-case>
                <div className="complex-case__frame">
                  <div className="complex-case__copy" data-complex-reveal>
                    <div className="complex-case__eyebrow"><span>{project.number}</span><span aria-hidden="true" /><span>{project.label}</span></div>
                    <h3>{project.title}</h3>
                    <p className="complex-case__body">{project.body}</p>
                    <div className="complex-case__outcome">
                      <span>What this makes possible</span>
                      <p>{project.outcome}</p>
                    </div>
                  </div>
                  <div className="complex-case__visual" data-complex-reveal aria-hidden="true">
                    <div className="complex-case__visual-top"><span>A flow at a glance</span><span>{project.number} / 02</span></div>
                    <div className="complex-flow">
                      <span className="complex-flow__track"><span /></span>
                      <ol>
                        {project.flow.map((stage, i) => (
                          <li key={stage} data-complex-node>
                            <span className="complex-flow__marker"><span /></span>
                            <span className="complex-flow__ordinal">0{i + 1}</span>
                            <strong>{stage}</strong>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="complex-case__visual-bottom"><span>One connected way of working</span><span aria-hidden="true">↗</span></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="complex-close" aria-labelledby="complex-close-title">
          <div className="complex-close__inner" data-complex-reveal>
            <p className="complex-eyebrow">03 / {COMPLEX.close.label}</p>
            <h2 id="complex-close-title">{COMPLEX.close.heading}</h2>
            <p>{COMPLEX.close.body}</p>
            <a className="complex-link complex-link--brand" href={`mailto:${site.contact.email}?subject=Operations%20conversation`}>
              {COMPLEX.close.action} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
