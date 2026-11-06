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
  const [activeWay, setActiveWay] = useState(0)
  const channels = useReveal<HTMLElement>()
  const faq = useReveal<HTMLElement>()

  return (
    <div className="min-h-screen bg-cream text-ink">
      <style>{`
        @keyframes contact-chat-in {
          0%, 5% { opacity: 0; transform: translateY(8px) scale(.94); }
          14%, 86% { opacity: 1; transform: translateY(0) scale(1); }
          96%, 100% { opacity: 0; transform: translateY(0) scale(1); }
        }
        @keyframes contact-chat-typing {
          0%, 16% { opacity: 0; transform: translateY(6px); }
          22%, 39% { opacity: 1; transform: translateY(0); }
          44%, 100% { opacity: 0; transform: translateY(0); }
        }
        @keyframes contact-chat-reply {
          0%, 39% { opacity: 0; transform: translateY(8px) scale(.94); }
          49%, 86% { opacity: 1; transform: translateY(0) scale(1); }
          96%, 100% { opacity: 0; transform: translateY(0) scale(1); }
        }
        @keyframes contact-dot {
          0%, 60%, 100% { opacity: .35; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        .contact-chat-in { animation: contact-chat-in 6s cubic-bezier(.22,1,.36,1) infinite; }
        .contact-chat-typing { animation: contact-chat-typing 6s cubic-bezier(.22,1,.36,1) infinite; }
        .contact-chat-reply { animation: contact-chat-reply 6s cubic-bezier(.22,1,.36,1) infinite; }
        .contact-dot { animation: contact-dot .9s ease-in-out infinite; }
        .contact-dot:nth-child(2) { animation-delay: .15s; }
        .contact-dot:nth-child(3) { animation-delay: .3s; }
        @media (min-width: 768px) {
          .faq-bot-head { right: -78px; top: 50%; bottom: auto; transform: translateY(-50%) scale(var(--bot-scale, 1)) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .contact-chat-in, .contact-chat-reply { animation: none; opacity: 1; transform: none; }
          .contact-chat-typing { animation: none; opacity: 0; }
          .contact-dot { animation: none; opacity: .7; }
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
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent" />
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

        {/* A single connected directory, in the visual language of the projects page. */}
        <section ref={channels.ref} className="mx-auto w-full max-w-[1100px] px-6 pb-14 pt-[clamp(56px,9vh,96px)] lg:px-10 md:pb-20" aria-labelledby="contact-ways-title">
          <div className={channels.revealed ? 'animate-fade-up' : 'opacity-0'}>
            <Eyebrow>{CONTACT.label}</Eyebrow>
            <h2 id="contact-ways-title" className="mt-5 max-w-xl font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-ink">
              Three ways to{' '}
              <span className="relative inline-block">
                <span className="relative z-10 italic text-brand-600">connect.</span>
                <Underline active={channels.revealed} />
              </span>
            </h2>
          </div>

          <div className={`mt-9 grid overflow-hidden rounded-[28px] border border-ink/[0.08] bg-white/70 p-3 shadow-soft backdrop-blur-sm md:rounded-[32px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] ${channels.revealed ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '140ms' }}>
            {/* One illuminated screen, like the project cards; the highlighted
                route follows the link under the pointer or keyboard focus. */}
            <div className="relative min-h-[200px] overflow-hidden rounded-[20px] sm:min-h-[250px] lg:min-h-[390px]" aria-hidden="true" style={{ background: 'radial-gradient(120% 80% at 50% 120%, rgba(225,173,52,.2), transparent 60%), linear-gradient(rgba(127,179,204,.07) 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, rgba(127,179,204,.07) 1px, transparent 1px) 0 0 / 20px 20px, #17181b' }}>
              <div className="absolute left-6 top-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-glass-300">{CONTACT.label}</div>
              <div className="absolute right-6 top-6 text-[12px] font-semibold tracking-[0.14em] text-white/50">0{activeWay + 1} / 03</div>
              <svg viewBox="0 0 400 260" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
                {['M135 146 C205 146 198 94 280 94', 'M135 146 H280', 'M135 146 C205 146 198 198 280 198'].map((d, i) => (
                  <path key={d} d={d} stroke={activeWay === i ? '#E1AD34' : 'rgba(143,192,214,.25)'} strokeWidth="1.5" strokeDasharray="5 6" className="transition-colors duration-300" />
                ))}
              </svg>
              <div className="absolute left-[33.75%] top-[56%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-brand/50 bg-brand/10 shadow-[0_0_42px_rgba(225,173,52,0.15)] sm:h-20 sm:w-20">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-ink sm:h-12 sm:w-12"><ContactIcon id={CONTACT.ways[activeWay].id} /></span>
              </div>
              {CONTACT.ways.map((way, i) => (
                <div key={way.id} className={`absolute left-[70%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[12px] font-semibold tracking-[0.14em] transition-all duration-300 ${activeWay === i ? 'border-brand bg-brand text-ink shadow-[0_0_25px_rgba(225,173,52,0.25)]' : 'border-glass-300/40 bg-[#17181b] text-glass-300'}`} style={{ top: `${36 + i * 20}%` }}>0{i + 1}</div>
              ))}
            </div>

            <div className="divide-y divide-ink/[0.08] px-2 sm:px-5 lg:px-7">
              {CONTACT.ways.map((way, i) => (
                <a
                  key={way.id}
                  href={way.href}
                  {...external(way.external)}
                  onMouseEnter={() => setActiveWay(i)}
                  onFocus={() => setActiveWay(i)}
                  className="group grid min-w-0 grid-cols-1 gap-x-4 py-6 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-glass sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-6 sm:py-7"
                >
                  <span className="hidden pt-1 text-[12px] font-semibold tracking-[0.14em] text-glass sm:block" aria-hidden="true">0{i + 1}</span>
                  <span className="min-w-0">
                    <span className="mb-2 block text-[12px] font-semibold tracking-[0.14em] text-glass sm:hidden" aria-hidden="true">0{i + 1}</span>
                    <span className="block font-display text-[1.35rem] leading-tight tracking-[-0.01em] text-ink">{way.name}</span>
                    <span className="mt-2 block max-w-[42ch] text-[15px] font-light leading-relaxed text-ink-soft">{way.body}</span>
                    <span className="mt-3 flex min-w-0 items-baseline gap-2 text-[14px] font-semibold text-glass"><span className="min-w-0 [overflow-wrap:anywhere]">{way.action}</span><span className="shrink-0 sm:hidden" aria-hidden="true">{way.external ? '↗' : '→'}</span></span>
                  </span>
                  <span className="mt-0.5 hidden h-9 w-9 place-items-center rounded-full border border-ink/10 text-ink/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-ink group-focus-visible:border-brand group-focus-visible:bg-brand group-focus-visible:text-ink sm:grid" aria-hidden="true">{way.external ? '↗' : '→'}</span>
                </a>
              ))}
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
            <div className="grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.6fr)] md:gap-16">
              {/* Left heading — STICKS until Qs pass */}
              <FaqHeading revealed={faq.revealed} />

              {/* Q list */}
              <div className={`flex min-w-0 flex-col gap-2.5 ${faq.revealed ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '140ms' }}>
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

function TypingDots() {
  return <>{[0, 1, 2].map((dot) => <span key={dot} className="contact-dot h-1.5 w-1.5 rounded-full bg-glass" />)}</>
}

function FaqHeading({ revealed }: { revealed: boolean }) {
  return (
    <div>
      <div className={`md:sticky md:top-28 ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
        <Eyebrow>Frequently asked questions</Eyebrow>
        <h2 id="faq-title" className="mt-5 font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em]">
          Things you<br />might ask.
        </h2>
        <div className="relative mt-8 h-[126px] w-[210px]" aria-hidden="true">
          <div className="contact-chat-in absolute right-0 top-0 h-11 w-[138px] rounded-[20px] rounded-br-md border border-glass/15 bg-white/70 shadow-[0_10px_24px_-18px_rgba(27,26,23,.35)]" />
          <div className="contact-chat-typing absolute left-0 top-[60px] flex h-11 w-[72px] items-center justify-center gap-1.5 rounded-[20px] rounded-bl-md bg-[#F1E4D1]">
            <TypingDots />
          </div>
          <div className="contact-chat-reply absolute left-0 top-[60px] h-11 w-[156px] rounded-[20px] rounded-bl-md bg-[#F1E4D1]" />
        </div>
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
  const [answerReady, setAnswerReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setAnswerReady(false)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnswerReady(true)
      return
    }
    const timer = window.setTimeout(() => setAnswerReady(true), 1000)
    return () => window.clearTimeout(timer)
  }, [open])

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
        <span className="font-display text-[clamp(1rem,1.2vw,1.15rem)] leading-snug tracking-[-0.01em]">
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

      {/* The head sits outside the height-clipped panel, so it stays visible. */}
      <div className="relative md:mr-24">
        <div
          style={{ height: open ? h : 0, overflow: 'hidden', transition: 'height 520ms cubic-bezier(0.22,1,0.36,1)' }}
          aria-hidden={!open}
        >
          <div ref={ansRef} className="pt-2 md:pt-3">
            <div className="relative rounded-[28px] px-7 py-7 pr-20 md:rounded-[32px] md:px-9 md:py-8" style={{ background: PEACH }}>
              <div className="absolute left-7 top-7 flex h-6 items-center gap-1.5 transition-opacity duration-200 md:left-9 md:top-8" style={{ opacity: open && !answerReady ? 1 : 0 }} aria-hidden="true">
                <TypingDots />
              </div>
              <p
                className="max-w-[56ch] text-[15px] font-light leading-[1.75] text-ink-soft"
                style={{ opacity: open && answerReady ? 1 : 0, transform: open && answerReady ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 350ms ease, transform 480ms cubic-bezier(0.22,1,0.36,1)' }}
                aria-hidden={!answerReady}
                aria-live="polite"
              >{a}</p>
              {open && !answerReady && <span className="sr-only" role="status">Loading answer</span>}
            </div>
          </div>
        </div>
        <img
          src="/robot-faq-head.png"
          alt=""
          draggable={false}
          className="faq-bot-head pointer-events-none absolute bottom-[-18px] right-1 h-auto w-[64px] md:w-[72px]"
          style={{
            ['--bot-scale' as string]: open && answerReady ? 1 : 0.6,
            transform: open && answerReady ? 'scale(1)' : 'scale(0.6)',
            opacity: open && answerReady ? 1 : 0,
            transition: 'transform 520ms cubic-bezier(0.22,1,0.36,1), opacity 380ms ease',
            filter: 'drop-shadow(0 8px 10px rgba(27,26,23,0.22))',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
