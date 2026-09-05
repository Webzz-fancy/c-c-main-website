import { useRobotMood, type RobotMood } from '../context/RobotMood'
import { useReveal } from '../hooks/useReveal'
import Eyebrow from './Eyebrow'
import Underline from './Underline'

type Option = {
  kicker: string
  title: string
  body: string
  cta: string
  href: string
  mood: RobotMood
  icon: 'problem' | 'consultation'
}

const OPTIONS: Option[] = [
  {
    kicker: 'Not sure where to start',
    title: 'Drop Your Problem',
    body: 'Not sure what you need? Just tell us what is not working in your business. We will review your situation and tell you exactly how we can help.',
    cta: 'Drop Your Problem',
    href: '#drop-problem',
    mood: 'surprised',
    icon: 'problem',
  },
  {
    kicker: 'Ready to fix it',
    title: 'Book a Consultation',
    body: 'This is a focused one-on-one session where we examine what’s not working in your backend operations, including systems, processes, and workflows. We then start mapping a clear plan to help you scale.',
    cta: 'Book a Consultation',
    href: '#book-consultation',
    mood: 'happy',
    icon: 'consultation',
  },
]

function OptionIcon({ name }: { name: Option['icon'] }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'problem') {
    // Speech bubble with a question spark
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...common}>
        <path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H9l-4.5 3.5V6.5A2.5 2.5 0 0 1 7 4h10.5A2.5 2.5 0 0 1 20 6.5z" />
        <path d="M10.3 9.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.7-.8 1.2v.3" />
        <circle cx="12.1" cy="14.8" r=".6" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  // Calendar with a check
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...common}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      <path d="m9.2 15.1 1.9 1.9 3.7-3.7" />
    </svg>
  )
}

function OptionCard({ option, index }: { option: Option; index: number }) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.2 })
  const { moodHandlers } = useRobotMood()

  return (
    <div
      ref={ref}
      className="group relative flex h-full flex-col rounded-[24px] border border-white/60 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/90 sm:p-9"
      style={{
        background:
          'linear-gradient(150deg, rgba(255,255,255,0.62) 0%, rgba(45,109,139,0.045) 55%, rgba(45,109,139,0.06) 100%)',
        backdropFilter: 'blur(22px) saturate(170%)',
        WebkitBackdropFilter: 'blur(22px) saturate(170%)',
        boxShadow: '0 26px 70px -34px rgba(18,44,56,0.42), inset 0 1px 0 rgba(255,255,255,0.85)',
        opacity: revealed ? 1 : 0,
        filter: revealed ? 'blur(0px)' : 'blur(12px)',
        transform: revealed ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, filter 800ms cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 800ms cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, border-color 400ms ease, box-shadow 400ms ease`,
      }}
    >
      {/* Warm accent that blooms on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/70 bg-white/70 text-brand-600 shadow-[0_8px_20px_-12px_rgba(18,44,56,0.5)] transition-all duration-500 group-hover:border-brand/40 group-hover:bg-brand group-hover:text-ink">
            <OptionIcon name={option.icon} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {option.kicker}
          </span>
        </div>

        <h3 className="mt-6 font-display text-[clamp(1.5rem,2.3vw,1.95rem)] leading-tight tracking-[-0.01em] text-ink">
          {option.title}
        </h3>

        <p className="mt-3.5 text-[15px] font-light leading-relaxed text-ink-soft">{option.body}</p>

        {/* mt-auto keeps both buttons aligned even with unequal copy */}
        <div className="mt-auto pt-8">
          <a
            href={option.href}
            {...moodHandlers(option.mood)}
            className="inline-flex items-center gap-2.5 rounded-full bg-brand px-6 py-3 text-[14.5px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_20px_38px_-14px_rgba(225,173,52,0.85)] active:translate-y-0"
          >
            {option.cta}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default function WaysToWork() {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.2 })

  const rise = (delay: number) => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <section id="ways-we-help" className="relative w-full bg-cream py-24 md:py-32">
      {/* ---------- Ambient blue wash ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, rgba(45,109,139,0.045) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
        <div
          className="absolute -left-32 bottom-10 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        {/* ---------- Heading ---------- */}
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center" style={rise(0)}>
            Work With Us
          </Eyebrow>

          <h2
            className="mt-5 font-display text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.06] tracking-[-0.02em] text-ink"
            style={rise(90)}
          >
            Two ways to{' '}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-brand-600">work with us</span>
              <Underline active={revealed} delay={650} />
            </span>
          </h2>
        </div>

        {/* ---------- Cards ---------- */}
        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8">
          {OPTIONS.map((option, i) => (
            <OptionCard key={option.title} option={option} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
