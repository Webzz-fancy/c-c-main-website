import { useLayoutEffect, useRef, type RefObject } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import HeroNetwork from '../components/complex/HeroNetwork'
import MethodJourney from '../components/complex/MethodJourney'
import ProjectStory from '../components/complex/ProjectStory'
import { COMPLEX } from '../content/complex'
import { site } from '../config/site'
import './complex.css'

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Section reveals scrub with the reader's scroll. The hero loop and the two
 * pinned timelines keep their own independent schedules.
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
          <div className="complex-work__head" data-complex-reveal>
            <p className="complex-eyebrow">02 / {COMPLEX.work.label}</p>
            <h2 id="complex-work-title">{COMPLEX.work.heading}</h2>
            <p className="complex-work__intro">{COMPLEX.work.intro}</p>
          </div>
          {COMPLEX.projects.map((project) => (
            <ProjectStory key={project.id} project={project} />
          ))}
        </section>

        <section className="complex-close" aria-labelledby="complex-close-title">
          <div className="complex-close__inner" data-complex-reveal>
            <p className="complex-eyebrow">03 / {COMPLEX.close.label}</p>
            <h2 id="complex-close-title">{COMPLEX.close.heading}</h2>
            <p>{COMPLEX.close.body}</p>
            <div className="complex-close__actions">
              <p className="complex-close__note">
                <svg viewBox="0 0 12 14" aria-hidden="true" focusable="false">
                  <path d="M2 6V4.2a4 4 0 0 1 8 0V6" />
                  <rect x=".8" y="5.8" width="10.4" height="7.4" rx="1.4" />
                </svg>
                {COMPLEX.close.assurance}
              </p>
              <a className="complex-link complex-link--brand" href={`mailto:${site.contact.email}?subject=Operations%20conversation`}>
                {COMPLEX.close.action} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
