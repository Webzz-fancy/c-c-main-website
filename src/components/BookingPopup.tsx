import { useEffect, useRef, useState } from 'react'
import { site } from '../config/site'
import { BOOKING, type Consultation } from '../content/booking'

/**
 * Booking in a sheet over the page: first the choice between the free call
 * and the paid strategy session, then that one's calendar. Any plain click on
 * a booking link anywhere on the site opens it; a click that asks for a new
 * tab, and visitors without JavaScript, still get the ordinary link. A
 * calendar is only requested from Google once someone picks one.
 */
export default function BookingPopup() {
  const [wanted, setWanted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Consultation | null>(null)
  const [loaded, setLoaded] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element).closest('a')
      if (link?.href !== site.links.booking) return
      e.preventDefault()
      lastFocus.current = link
      setWanted(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (wanted) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setOpen(true))
      const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60)
      return () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(t)
      }
    }
    setOpen(false)
    const t = window.setTimeout(() => {
      setMounted(false)
      setPicked(null)
      setLoaded(false)
      ;(lastFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true })
    }, 300)
    return () => window.clearTimeout(t)
  }, [wanted])

  useEffect(() => {
    if (!wanted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWanted(false)
    }
    window.addEventListener('keydown', onKey)
    // the page holds still under the sheet
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [wanted])

  const pick = (c: Consultation | null) => {
    setLoaded(false)
    setPicked(c)
    if (c) window.plausible?.('Choose consultation', { props: { type: c.id, page: window.location.pathname } })
  }

  if (!mounted) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-300',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-popup-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => setWanted(false)}
      />
      <div
        className={[
          'relative flex h-[100svh] w-full flex-col overflow-hidden bg-cream shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'sm:h-[min(800px,calc(100svh-40px))] sm:w-[min(1000px,calc(100vw-40px))] sm:rounded-[28px]',
          open ? 'translate-y-0' : 'translate-y-4',
        ].join(' ')}
      >
        <div className="flex items-center gap-4 px-5 py-4 sm:px-7 sm:py-5">
          <img src="/robot-head.png" alt="" className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
          <div className="min-w-0 flex-1">
            <h2 id="booking-popup-title" className="font-display text-[clamp(1.35rem,3vw,1.9rem)] leading-tight tracking-[-0.02em] text-ink">
              {picked ? (
                <>
                  {picked.name.split(' ')[0]} <span className="italic text-brand-600">{picked.name.split(' ').slice(1).join(' ')}</span>
                </>
              ) : (
                <>
                  {BOOKING.heading} <span className="italic text-brand-600">{BOOKING.emphasis}</span>
                </>
              )}
            </h2>
            <p className="mt-0.5 text-[14px] font-light leading-snug text-ink-soft">
              {picked ? `${picked.price} · ${picked.length}` : BOOKING.intro}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setWanted(false)}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-white text-ink transition-colors duration-200 hover:bg-brand-50"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>

        {picked ? (
          <>
            <div className="relative mx-2 flex-1 overflow-hidden rounded-[20px] border border-black/[0.06] bg-white sm:mx-5">
              {!loaded && (
                <p className="absolute inset-0 grid place-items-center font-display text-[20px] italic text-brand-600">
                  Finding your calendar…
                </p>
              )}
              <iframe
                key={picked.id}
                src={picked.embed}
                title={`Book the ${picked.name} with Clause & Code`}
                onLoad={() => setLoaded(true)}
                className={['relative h-full w-full border-0 transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0'].join(' ')}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-[13px] text-ink-muted sm:px-7">
              <button type="button" onClick={() => pick(null)} className="font-medium text-glass underline underline-offset-4">
                ← {BOOKING.back}
              </button>
              <span>
                Calendar not showing?{' '}
                <a href={picked.embed} target="_blank" rel="noopener" className="font-medium text-glass underline underline-offset-4">
                  Open it in a new tab
                </a>
              </span>
            </div>
          </>
        ) : (
          <div className="grid flex-1 content-start gap-4 overflow-y-auto px-2 pb-5 sm:grid-cols-2 sm:px-5">
            {BOOKING.consultations.map((c) => (
              <section key={c.id} className="flex flex-col rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-soft sm:p-7" aria-labelledby={`booking-${c.id}`}>
                <div className="flex flex-wrap gap-2">
                  <span className={['rounded-full px-3 py-1 text-[13px] font-semibold', c.id === 'initial' ? 'bg-brand-50 text-brand-600' : 'bg-ink text-white'].join(' ')}>{c.price}</span>
                  <span className="rounded-full border border-black/[0.08] px-3 py-1 text-[13px] text-ink-soft">{c.length}</span>
                </div>
                <h3 id={`booking-${c.id}`} className="mt-4 font-display text-[clamp(1.4rem,2.4vw,1.75rem)] leading-tight tracking-[-0.02em] text-ink">
                  {c.name}
                </h3>
                {c.lead && <p className="mt-2 font-display text-[17px] italic text-brand-600">{c.lead}</p>}
                <p className="mt-3 text-[15px] font-light leading-relaxed text-ink-soft">{c.body}</p>
                {c.notes.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-[14px] leading-snug text-ink">
                    {c.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300"
                  >
                    {c.action} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
