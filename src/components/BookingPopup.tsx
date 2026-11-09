import { useEffect, useRef, useState } from 'react'
import { site } from '../config/site'

/**
 * The booking calendar in a sheet over the page. Any plain click on a booking
 * link anywhere on the site opens it; a click that asks for a new tab, and
 * visitors without JavaScript, still get the ordinary link. The calendar is
 * only requested from Google once someone asks for it.
 */
export default function BookingPopup() {
  const [wanted, setWanted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
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
              Let’s find <span className="italic text-brand-600">a time.</span>
            </h2>
            <p className="mt-0.5 hidden text-[14px] font-light leading-snug text-ink-soft sm:block">{site.consultation}</p>
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

        <div className="relative mx-2 flex-1 overflow-hidden rounded-[20px] border border-black/[0.06] bg-white sm:mx-5">
          {!loaded && (
            <p className="absolute inset-0 grid place-items-center font-display text-[20px] italic text-brand-600">
              Finding your calendar…
            </p>
          )}
          <iframe
            src={site.links.bookingEmbed}
            title="Book a consultation with Clause & Code"
            onLoad={() => setLoaded(true)}
            className={['relative h-full w-full border-0 transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0'].join(' ')}
          />
        </div>

        <p className="px-5 py-3 text-center text-[13px] text-ink-muted">
          Calendar not showing?{' '}
          <a href={site.links.bookingEmbed} target="_blank" rel="noopener" className="font-medium text-glass underline underline-offset-4">
            Open it in a new tab
          </a>
        </p>
      </div>
    </div>
  )
}
