import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import Underline from '../components/Underline'
import { CONTACT } from '../content/contact'
import { FAQ } from '../config/seo'
import { site } from '../config/site'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const external = (on?: boolean) => (on ? { target: '_blank', rel: 'noopener' } : {})

const PEACH = '#F1E4D1'
const GOLD = '#E1AD34'

export default function ContactPage() {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 620)
    return () => window.clearTimeout(t)
  }, [])
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-cream text-ink">
      <style>{`
        @media (min-width: 768px) {
          .faq-bot-head { right: -78px !important; top: 50% !important; bottom: auto !important; transform: translateY(-50%) scale(var(--bot-scale,1)) !important; }
        }
      `}</style>
      <ScrollRope />
      <Header />
      <main>
        {/* Hero — same type scale as the rest of the site */}
        <section className="relative flex min-h-[72svh] w-full flex-col overflow-hidden bg-cream pt-[104px] md:pt-28">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 grain opacity-70" />
            <div
              className="absolute -right-40 -top-32 h-[640px] w-[760px] rounded-full blur-3xl"
              style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.16) 0%, rgba(225,173,52,0) 68%)' }}
            />
            <div
              className="absolute -bottom-36 -left-40 h-[620px] w-[760px] rounded-full blur-3xl"
              style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.10) 0%, rgba(45,109,139,0) 68%)' }}
            />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center px-6 pb-10 lg:px-10 lg:pb-16">
            <Eyebrow>{CONTACT.label}</Eyebrow>

            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.6rem,min(6.4vw,8vh),4.9rem)] leading-[1.02] tracking-[-0.03em] text-balance">
              {CONTACT.heading}
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 italic text-brand-600">{CONTACT.emphasis}</span>
                <Underline active={drawn} />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[clamp(0.98rem,1.2vw,1.1rem)] font-light leading-relaxed text-balance text-ink-soft">
              {CONTACT.intro}
            </p>

            <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
              <a
                href={CONTACT.ways[0].href}
                {...external(CONTACT.ways[0].external)}
                className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300"
              >
                {CONTACT.ways[0].action}
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>↗</span>
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-glass/30 bg-white/50 px-7 py-3.5 text-[15px] font-semibold text-glass backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-glass hover:bg-white"
              >
                Email us
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Contact channels */}
        <section className="mx-auto w-full max-w-[1100px] px-6 pb-14 lg:px-10 md:pb-20">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {CONTACT.ways.map((way, i) => (
              <a
                key={way.id}
                href={way.href}
                {...external(way.external)}
                className={[
                  'group block rounded-2xl p-6 transition-all duration-300',
                  i === 0 ? 'bg-brand text-ink shadow-brand' : 'bg-white/60 ring-1 ring-ink/[0.06] hover:ring-glass/30 hover:bg-white',
                ].join(' ')}
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.22em] opacity-70">0{i + 1}</div>
                <div className="mt-4 font-display text-[1.5rem] leading-tight tracking-[-0.015em]">{way.name}</div>
                <p className={['mt-3 text-[15px] font-light leading-relaxed', i === 0 ? 'text-ink/80' : 'text-ink-soft'].join(' ')}>
                  {way.body}
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold">
                  {way.action}
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                    {way.external ? '↗' : '→'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Quiz nudge */}
        <section className="mx-auto w-full max-w-[1100px] px-6 pb-14 lg:px-10">
          <p className="flex flex-wrap items-center gap-x-2 text-[15px] font-light text-ink-soft">
            {CONTACT.quiz.lead}
            <a
              href={CONTACT.quiz.href}
              className="group inline-flex items-center gap-1 font-semibold text-glass-600 underline decoration-glass/30 underline-offset-4 hover:text-glass hover:decoration-glass"
            >
              {CONTACT.quiz.action}
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
            </a>
          </p>
        </section>

        {/* FAQ */}
        <section className="relative w-full bg-cream pb-24 pt-6 md:pt-8" aria-labelledby="faq-title">
          <div className="pointer-events-none absolute inset-0 grain opacity-30" aria-hidden />
          <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-20">
            <div className="grid gap-12 md:grid-cols-[0.92fr_1.6fr] md:gap-16">
              {/* Left heading — STICKS until Qs pass */}
              <FaqHeading />

              {/* Q list */}
              <div className="flex flex-col gap-2.5">
                {FAQ.map(({ q, a }, i) => (
                  <FaqItem
                    key={q}
                    q={q}
                    a={a}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                    delay={i * 60}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FaqHeading() {
  const ref = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(true)

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const parent = el.parentElement?.parentElement // section grid
      const r = parent?.getBoundingClientRect()
      if (!r) return
      // stop sticking when the bottom of the FAQ grid leaves the viewport
      setStuck(r.bottom > window.innerHeight * 0.55)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div>
      <div
        ref={ref}
        className={stuck ? 'md:sticky md:top-28' : ''}
      >
        <Eyebrow>Frequently asked questions</Eyebrow>
        <h2 id="faq-title" className="mt-5 font-display text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.03] tracking-[-0.025em]">
          Things you<br />might ask.
        </h2>
        {/* generated robot illustration for under the heading */}
        <img
          src="/robot-faq-mark.png"
          alt=""
          aria-hidden
          className="mt-8 h-[120px] w-auto md:h-[150px]"
          draggable={false}
        />
      </div>
    </div>
  )
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
  delay,
}: {
  q: string
  a: string
  open: boolean
  onToggle: () => void
  delay: number
}) {
  const ansRef = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)

  useLayoutEffect(() => {
    if (!ansRef.current) return
    const el = ansRef.current
    const m = () => setH(el.scrollHeight)
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    window.addEventListener('resize', m)
    return () => { ro.disconnect(); window.removeEventListener('resize', m) }
  }, [a])

  return (
    <div style={{ transition: `opacity 500ms ease ${delay}ms` }}>
      {/* Question pill */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 rounded-full px-6 py-4 text-left transition-[max-width,background,border-color,transform] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:px-7 md:py-[18px]"
        style={{
          background: open ? 'transparent' : PEACH,
          border: open ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
          color: '#1B1A17',
          maxWidth: open ? '62%' : '100%',
        }}
      >
        <span className="font-display text-[clamp(1.1rem,1.5vw,1.45rem)] leading-[1.15] tracking-[-0.015em]">
          {q}
        </span>
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-[480ms]"
          style={{
            background: open ? GOLD : 'rgba(255,255,255,0.55)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          aria-hidden
        >
          <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </span>
      </button>

      {/* Answer panel + floating robot head at bottom-right */}
      <div
        style={{
          height: open ? h : 0,
          overflow: 'hidden',
          transition: 'height 520ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div ref={ansRef} className="relative pt-2 md:pt-3">
          <div
            className="relative rounded-[28px] px-7 py-7 md:rounded-[32px] md:px-9 md:py-8"
            style={{ background: PEACH }}
          >
            <p
              className="max-w-[56ch] text-[15px] font-light leading-[1.75] text-ink-soft md:text-[16px]"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 420ms ease 180ms, transform 480ms cubic-bezier(0.22,1,0.36,1) 160ms',
              }}
            >
              {a}
            </p>
          </div>

          {/* Robot head — tight-cropped transparent PNG, to the RIGHT of
              the answer panel (outside it, where you circled), vertically
              centered on desktop at the panel's middle, no gold circle,
              drop shadow. Mobile falls back to bottom-right to stay
              on-screen. */}
          <img
            src="/robot-faq-head.png"
            alt=""
            aria-hidden
            draggable={false}
            className="faq-bot-head"
            style={{
              ['--bot-scale' as any]: open ? 1 : 0.6,
              position: 'absolute',
              right: '4px',
              bottom: '-26px',
              height: '72px',
              width: 'auto',
              objectFit: 'contain',
              transform: open ? 'scale(1)' : 'scale(0.6)',
              opacity: open ? 1 : 0,
              transition: `transform 520ms cubic-bezier(0.22,1,0.36,1) 200ms, opacity 380ms ease ${open ? '180ms' : '0ms'}`,
              filter: 'drop-shadow(0 8px 18px rgba(27,26,23,0.22))',
            }}
          />
        </div>
      </div>
    </div>
  )
}
