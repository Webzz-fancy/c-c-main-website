import { useEffect, useRef, useState } from 'react'
import type { ComplexProject } from '../../content/complex'
import { StopsMiniMap } from './MiniMap'
import WorkflowWalk from './WorkflowWalk'
import { BookButton, QuizLink } from './cta'

/**
 * A project's details, opened from its card in a sheet over the page: the
 * drawing, before and now, who uses it, how the work runs step by step (with
 * the workflow map following the reader through the steps), what else it
 * does, and the result. Escape, the scrim or the × close it, and the previous
 * focus comes back. The same text sits in the page's static HTML,
 * so crawlers and AI assistants read it without opening anything.
 */
type Props = {
  project: ComplexProject | null
  onClose: () => void
}

export default function ProjectDetail({ project, onClose }: Props) {
  // keep the last project while the sheet plays out
  const [shown, setShown] = useState<ComplexProject | null>(project)
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (project) {
      lastFocus.current = document.activeElement
      setShown(project)
      const raf = requestAnimationFrame(() => setOpen(true))
      const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60)
      return () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(t)
      }
    }
    setOpen(false)
    const t = window.setTimeout(() => {
      setShown(null)
      ;(lastFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true })
    }, 380)
    return () => window.clearTimeout(t)
  }, [project])

  // a different project starts at the top of the sheet
  useEffect(() => {
    if (project) bodyRef.current?.scrollTo(0, 0)
  }, [project])

  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // the page holds still under the sheet
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [project, onClose])

  if (!shown) return null
  const p = shown

  return (
    <div
      className="complex-detail"
      data-open={open ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complex-detail-title"
    >
      <button type="button" className="complex-detail__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="complex-detail__sheet">
        <div className="complex-detail__bar">
          <p className="complex-detail__meta">
            <span>{p.card.kind}</span>
            <span>{p.card.area}</span>
          </p>
          <button ref={closeRef} type="button" className="complex-detail__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>

        <div ref={bodyRef} className="complex-detail__body">
          <header className="complex-detail__head">
            <h2 id="complex-detail-title">{p.card.name}</h2>
            <p className="complex-detail__title">{p.title}</p>
            <p className="complex-detail__lede">{p.lede}</p>
            <div className="complex-detail__actions"><BookButton /></div>
          </header>

          <div className="complex-detail__overview">
            <div className="complex-card__visual"><StopsMiniMap stops={p.stops} /></div>
            <div className="complex-card__shift complex-detail__shift">
              <span className="complex-card__before"><b>Before</b>{p.card.before}</span>
              <span className="complex-card__after"><b>Now</b>{p.card.after}</span>
            </div>
          </div>

          <section className="complex-detail__section" aria-labelledby="complex-detail-roles">
            <h3 id="complex-detail-roles">Who uses it</h3>
            <ul className="complex-detail__roles">
              {p.roles.map((role) => (
                <li key={role.name}>
                  <b>{role.name}</b>
                  <span>{role.access}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="complex-detail__section" aria-labelledby="complex-detail-steps">
            <h3 id="complex-detail-steps">How the work runs</h3>
            <WorkflowWalk project={p} scrollRoot={bodyRef} />
          </section>

          <section className="complex-detail__section" aria-labelledby="complex-detail-features">
            <h3 id="complex-detail-features">Also built in</h3>
            <ul className="complex-detail__features">
              {p.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </section>

          <section className="complex-detail__result">
            <h3>The result</h3>
            <p>{p.result}</p>
            <div className="complex-detail__actions">
              <BookButton />
              <QuizLink />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
