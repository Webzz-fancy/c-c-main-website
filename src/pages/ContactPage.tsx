import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import Underline from '../components/Underline'
import { CONTACT } from '../content/contact'
import { FAQ } from '../config/seo'
import { site } from '../config/site'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'

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
  const channels = useReveal<HTMLElement>()
  const faq = useReveal<HTMLElement>()

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
            <Eyebrow className="animate-fade-up" style={{ animationDelay: '80ms' }}>{CONTACT.label}</Eyebrow>

            <h1 className="animate-fade-up mt-5 max-w-3xl font-display text-[clamp(2rem,min(5.6vw,7vh),4.15rem)] leading-[1.04] tracking-[-0.02em] text-balance" style={{ animationDelay: '140ms' }}>
              {CONTACT.heading}
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 italic text-brand-600">{CONTACT.emphasis}</span>
                <Underline active={drawn} />
              </span>
            </h1>

            <p className="animate-fade-up mt-6 max-w-xl text-[clamp(0.92rem,min(1.3vw,1.85vh),1.08rem)] font-light leading-relaxed text-balance text-ink-soft" style={{ animationDelay: '220ms' }}>
              {CONTACT.intro}
            </p>

            <div className="animate-fade-up mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3" style={{ animationDelay: '300ms' }}>
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

        {/* Contact channels — one editorial directory, rather than three cards. */}
        <section ref={channels.ref} className="mx-auto w-full max-w-[1100px] px-6 pb-14 lg:px-10 md:pb-20" aria-labelledby="contact-ways-title">
          <div className="grid gap-9 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.35fr)] md:gap-12 lg:gap-20">
            <div className={channels.revealed ? 'animate-fade-up' : 'opacity-0'}>
              <Eyebrow>{CONTACT.label}</Eyebrow>
              <h2 id="contact-ways-title" className="mt-5 max-w-[9ch] font-display text-[clamp(2.4rem,4.2vw,4rem)] leading-[1.03] tracking-[-0.03em] text-ink">
                Three ways to{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 italic text-brand-600">connect.</span>
                  <Underline active={channels.revealed} />
                </span>
              </h2>
              {/* A quiet echo of the routes and nodes on the projects page. */}
              <svg viewBox="0 0 220 105" className="mt-10 hidden h-[105px] w-[220px] md:block" fill="none" aria-hidden="true">
                <path d="M14 87C57 87 59 26 108 26S164 77 205 77" stroke="#E1AD34" strokeWidth="1.5" strokeDasharray="7 7" />
                <circle cx="14" cy="87" r="4" fill="#E1AD34" />
                <circle cx="108" cy="26" r="10" fill="#F8F5F0" stroke="#E1AD34" strokeWidth="1.5" />
                <circle cx="108" cy="26" r="3" fill="#E1AD34" />
                <circle cx="205" cy="77" r="5" fill="#2D6D8B" />
              </svg>
            </div>

            <div className={`relative overflow-hidden rounded-[28px] border border-white/80 bg-white/45 shadow-soft backdrop-blur-sm md:rounded-[32px] ${channels.revealed ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '140ms' }}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent" aria-hidden="true" />
              <div className="relative divide-y divide-ink/[0.08]">
                {CONTACT.ways.map((way, i) => (
                  <a
                    key={way.id}
                    href={way.href}
                    {...external(way.external)}
                    className="group relative grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 px-5 py-6 transition-colors duration-300 hover:bg-white/65 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-glass sm:gap-x-6 sm:px-8 sm:py-8"
                  >
                    <span className="relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand/30 bg-[#F1E4D1]/70 text-brand-600 transition-all duration-300 group-hover:border-brand group-hover:bg-brand/20 sm:h-12 sm:w-12" aria-hidden="true">
                      <ContactIcon id={way.id} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold tracking-[0.14em] text-glass">0{i + 1}</span>
                      <span className="mt-2 block font-display text-[clamp(1.5rem,1.9vw,1.875rem)] leading-[1.12] tracking-[-0.02em] text-ink">{way.name}</span>
                      <span className="mt-2.5 block max-w-[38ch] text-[15px] font-light leading-relaxed text-ink-soft">{way.body}</span>
                      <span className="mt-4 block text-[14px] font-semibold text-glass [overflow-wrap:anywhere]">{way.action}</span>
                    </span>
                    <span className="mt-1 grid h-8 w-8 place-items-center rounded-full border border-ink/10 text-ink/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-ink" aria-hidden="true">{way.external ? '↗' : '→'}</span>
                  </a>
                ))}
              </div>
            </div>
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
        <section ref={faq.ref} className="relative w-full bg-cream pb-24 pt-6 md:pt-8" aria-labelledby="faq-title">
          <div className="pointer-events-none absolute inset-0 grain opacity-30" aria-hidden />
          <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-20">
            <div className="grid gap-12 md:grid-cols-[0.92fr_1.6fr] md:gap-16">
              {/* Left heading — STICKS until Qs pass */}
              <FaqHeading revealed={faq.revealed} />

              {/* Q list */}
              <div className={`flex flex-col gap-2.5 ${faq.revealed ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '140ms' }}>
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

function ContactIcon({ id }: { id: 'call' | 'whatsapp' | 'email' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {id === 'call' ? (
        <><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h3M8 17h6" /></>
      ) : id === 'whatsapp' ? (
        <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.4 2.8 2.7 5.1 5.5 5.5" /></>
      ) : (
        <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 5.5L19.5 7" /></>
      )}
    </svg>
  )
}

function FaqHeading({ revealed }: { revealed: boolean }) {
  return (
    <div>
      <div className={`md:sticky md:top-28 ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
        <Eyebrow>Frequently asked questions</Eyebrow>
        <h2 id="faq-title" className="mt-5 font-display text-[clamp(2.4rem,4.2vw,4rem)] leading-[1.03] tracking-[-0.03em]">
          Things you<br />might ask.
        </h2>
        <img src="/robot-faq-mark.png" alt="" aria-hidden className="mt-8 h-[120px] w-auto md:h-[150px]" draggable={false} />
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
          maxWidth: open ? 'min(100%, max(58%, 18rem))' : '100%',
        }}
      >
        <span className="font-display text-[clamp(1.2rem,1.6vw,1.5rem)] leading-[1.12] tracking-[-0.02em]">
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

      {/* The badge is a sibling of the clipped height animation, never inside it. */}
      <div className="relative md:mr-24">
        <div
          style={{ height: open ? h : 0, overflow: 'hidden', transition: 'height 520ms cubic-bezier(0.22,1,0.36,1)' }}
          aria-hidden={!open}
        >
          <div ref={ansRef} className="pt-2 md:pt-3">
            <div className="rounded-[28px] px-7 py-7 pr-20 md:rounded-[32px] md:px-9 md:py-8" style={{ background: PEACH }}>
              <p
                className="max-w-[56ch] text-[15px] font-light leading-[1.75] text-ink-soft md:text-[16px]"
                style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(8px)', transition: `opacity 420ms ease ${open ? 180 : 0}ms, transform 480ms cubic-bezier(0.22,1,0.36,1) ${open ? 180 : 0}ms` }}
              >{a}</p>
            </div>
          </div>
        </div>
        <img
          src="/robot-faq-head.png"
          alt=""
          draggable={false}
          className="faq-bot-head pointer-events-none absolute bottom-[-18px] right-1 h-auto w-[64px] md:w-[72px]"
          style={{
            ['--bot-scale' as string]: open ? 1 : 0.6,
            transform: open ? 'scale(1)' : 'scale(0.6)',
            opacity: open ? 1 : 0,
            transition: `transform 520ms cubic-bezier(0.22,1,0.36,1) ${open ? 180 : 0}ms, opacity 380ms ease ${open ? 180 : 0}ms`,
            filter: 'drop-shadow(0 8px 10px rgba(27,26,23,0.22))',
          }}
          aria-hidden
        />
      </div>
    </div>
  )
}
