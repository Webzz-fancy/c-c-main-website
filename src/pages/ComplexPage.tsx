import { useLayoutEffect, useRef, type RefObject } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import HeroNetwork from '../components/complex/HeroNetwork'
import MethodJourney from '../components/complex/MethodJourney'
import { COMPLEX } from '../content/complex'
import { site } from '../config/site'
import './complex.css'

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Project and section reveals follow the reader's scroll position. The hero
 * loop and pinned method journey keep their own independent timelines.
 */
function useComplexScroll(ref: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const cases = Array.from(root.querySelectorAll<HTMLElement>('[data-complex-case]'))
    const milestones = cases.map((el) => Array.from(el.querySelectorAll<HTMLElement>('[data-case-milestone]')))
    const nodes = cases.map((el) => Array.from(el.querySelectorAll<HTMLElement>('[data-complex-node]')))
    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-complex-reveal]'))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let active = true

    const draw = () => {
      frame = 0
      if (motion.matches) {
        cases.forEach((el, i) => {
          el.style.setProperty('--case-progress', '1')
          nodes[i].forEach((node) => node.style.setProperty('--lit', '1'))
        })
        return
      }
      const vh = window.innerHeight
      const revealRects = reveals.map((el) => el.getBoundingClientRect())

      cases.forEach((el, i) => {
        // Four concrete milestones in the text advance the four nodes in the
        // sticky workflow map. This keeps the diagram in step with the story.
        const positions = milestones[i].map((item) => item.getBoundingClientRect().top)
        const progress = clamp01((vh * 0.54 - positions[0]) / Math.max(1, positions[positions.length - 1] - positions[0]))
        el.style.setProperty('--case-progress', progress.toFixed(3))
        nodes[i].forEach((node, index) => {
          node.style.setProperty('--lit', clamp01(progress * (nodes[i].length - 1) - index + 1).toFixed(3))
        })
        milestones[i].forEach((item, index) => {
          item.style.setProperty('--stage-focus', clamp01(1 - Math.abs(positions[index] - vh * 0.54) / (vh * 0.7)).toFixed(3))
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
      schedule()
    }

    root.dataset.complexMotion = motion.matches ? 'off' : 'on'
    draw()
    const observer = new ResizeObserver(schedule)
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

export default function ComplexPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useComplexScroll(rootRef)

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
              <h1>{COMPLEX.hero.firstLine}{' '}<br /><em>{COMPLEX.hero.secondLine}</em></h1>
              <p className="complex-hero__intro">{COMPLEX.hero.intro}</p>
              <a className="complex-link complex-link--brand" href="#complex-approach">
                See the thinking <span aria-hidden="true">↘</span>
              </a>
            </div>
            <HeroNetwork />
          </div>
        </section>

        <MethodJourney />

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
                    <section className="complex-case__requirement" data-case-milestone data-complex-reveal>
                      <h4>The requirement</h4>
                      <p>{project.requirement}</p>
                    </section>
                    <section className="complex-case__process" aria-label="How we worked">
                      <h4>How we worked</h4>
                      <ol>
                        {project.process.map((step, i) => (
                          <li key={step.title} data-case-milestone data-complex-reveal>
                            <span className="complex-case__phase-number" aria-hidden="true">0{i + 1}</span>
                            <div>
                              <h5>{step.title}</h5>
                              <p>{step.body}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                    <section className="complex-case__outcome" data-complex-reveal>
                      <h4>The result</h4>
                      <p>{project.outcome}</p>
                    </section>
                  </div>
                  <div className="complex-case__visual" data-complex-reveal aria-hidden="true">
                    <div className="complex-case__visual-top"><span>The working path</span><span>{project.number} / 02</span></div>
                    <div className="complex-flow">
                      <span className="complex-flow__track"><span /></span>
                      <ol>
                        {project.flow.map((stage, i) => (
                          <li key={stage} data-complex-node>
                            <span className="complex-flow__marker"><span /></span>
                            <span className="complex-flow__ordinal">0{i + 1}</span>
                            <strong>{stage}</strong>
                            <span className="complex-flow__detail">{project.flowDetails[i]}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="complex-case__visual-bottom"><span>{project.visualNote}</span><span aria-hidden="true">↗</span></div>
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
