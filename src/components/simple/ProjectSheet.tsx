import { useEffect, useRef, useState } from 'react'
import type { Project } from './lineGeom'

/**
 * The project sheet — the popup a build opens into from the ring.
 *
 * Another window of the same desktop, over a dimmed, softened page: its
 * title bar carries the build's name and, top right, "See the site ↗" (the
 * whole sheet is a link to the site, in a new tab — the arrow is the label
 * of that). Under the bar: the screenshot of the site's home page, as it
 * stands when it has loaded, and beside it the tag and two lines about the
 * build. Escape, the scrim, or the × close it.
 *
 * It rises the way everything on this desktop does — translateY + blur —
 * and goes back the same way; the previous focus is restored on close.
 */
type Props = {
  project: Project | null
  index: number
  onClose: () => void
}

export const projectShot = (slug: string) => `/projects/${slug}.jpg`
/** the same screenshot at 720px wide — what the ring's previews show on
 *  phones (a fraction of the bytes and of the decoding for the same look
 *  at that size) */
export const projectShotSmall = (slug: string) => `/projects/${slug}-720.jpg`

export default function ProjectSheet({ project, index, onClose }: Props) {
  // keep the last project while the sheet plays out
  const [shown, setShown] = useState<Project | null>(project)
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    if (project) {
      lastFocus.current = document.activeElement
      setShown(project)
      // one frame at the start pose, then the rise
      const raf = requestAnimationFrame(() => setOpen(true))
      const t = window.setTimeout(() => closeRef.current?.focus(), 60)
      return () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(t)
      }
    }
    setOpen(false)
    const t = window.setTimeout(() => {
      setShown(null)
      const el = lastFocus.current as HTMLElement | null
      el?.focus?.()
    }, 420)
    return () => window.clearTimeout(t)
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
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-sheet-title"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      {/* the scrim: the desktop, dimmed and softened */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          background: 'rgba(27,26,23,0.42)',
          backdropFilter: open ? 'blur(10px)' : 'blur(0px)',
          WebkitBackdropFilter: open ? 'blur(10px)' : 'blur(0px)',
          opacity: open ? 1 : 0,
          transition: 'opacity 380ms ease, backdrop-filter 380ms ease, -webkit-backdrop-filter 380ms ease',
        }}
      />

      {/* the sheet */}
      <div
        className="relative flex max-h-[min(92svh,860px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[6px] border border-ink/85 text-ink shadow-[0_50px_120px_-30px_rgba(20,14,2,0.7)]"
        style={{
          backgroundColor: '#F6F2EA',
          transform: open ? 'translate3d(0, 0, 0)' : 'translate3d(0, 56px, 0)',
          filter: open ? 'blur(0px)' : 'blur(14px)',
          opacity: open ? 1 : 0,
          transition: 'transform 520ms cubic-bezier(0.16,1,0.3,1), filter 420ms ease, opacity 320ms ease',
        }}
      >
        {/* the title bar: index · name, and the way out to the site */}
        <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-ink/70 px-3 sm:px-4" style={{ backgroundColor: '#EDE7DB' }}>
          <div className="flex items-center gap-3">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-[18px] w-[18px] place-items-center border border-ink/80 transition-colors hover:bg-ink hover:text-white"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
            <span id="project-sheet-title" className="font-mono text-[12px] tracking-[0.04em]">
              {String(index + 1).padStart(2, '0')}&nbsp;&nbsp;{p.name}
            </span>
          </div>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/85 transition-colors hover:text-ink"
          >
            <span className="relative">
              See the site
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:origin-left group-hover:scale-x-100" />
            </span>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-ink/80 transition-all duration-300 group-hover:bg-ink group-hover:text-white">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <path d="M2 8l6-6M3 2h5v5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </span>
          </a>
        </div>

        {/* the body: the screenshot, and beside it the words */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1.55fr_1fr]">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden border-b border-ink/60 lg:border-b-0 lg:border-r"
            style={{ backgroundColor: p.tint }}
            aria-label={`Open ${p.name} in a new tab`}
          >
            <div className="relative aspect-[16/10] w-full">
              <img
                src={projectShot(p.slug)}
                alt={`${p.name}, ${p.tag.toLowerCase()} website by Clause & Code`}
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015]"
                loading="eager"
                decoding="async"
              />
            </div>
          </a>
          <div className="flex flex-col p-5 sm:p-7 lg:p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">{p.tag}</div>
            <h3 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[0.96] tracking-[-0.02em]">
              {p.name}
            </h3>
            <p className="mt-5 text-[14.5px] font-light leading-relaxed text-ink/85">{p.lines[0]}</p>
            <p className="mt-2.5 text-[14.5px] font-light leading-relaxed text-ink/70">{p.lines[1]}</p>
            <div className="mt-auto pt-7">
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em]"
              >
                <span className="relative">
                  [ See the site ]
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:origin-left group-hover:scale-x-100" />
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* the status bar */}
        <div className="flex h-[28px] shrink-0 items-center justify-between border-t border-ink/60 px-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink/55 sm:px-4" style={{ backgroundColor: '#EDE7DB' }}>
          <span>Clause &amp; Code · Websites</span>
          <span className="hidden sm:inline">Esc to close</span>
          <span>{String(index + 1).padStart(2, '0')} / 06</span>
        </div>
      </div>
    </div>
  )
}
