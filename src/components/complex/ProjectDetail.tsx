import { useEffect, useRef, useState } from 'react'
import type { ComplexProject } from '../../content/complex'
import { workPath } from '../../content/work'
import ProjectContent from './ProjectContent'

/**
 * A project's details, opened from its card in a sheet over the page. Escape,
 * the scrim or the × close it, and the previous focus comes back. The same
 * details have their own page at /work/<slug>, which is what search engines,
 * AI assistants and shared links reach.
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
          <a className="complex-detail__full" href={workPath(p)}>Full page</a>
          <button ref={closeRef} type="button" className="complex-detail__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>

        <div ref={bodyRef} className="complex-detail__body">
          <ProjectContent project={p} scrollRoot={bodyRef} />
        </div>
      </div>
    </div>
  )
}
