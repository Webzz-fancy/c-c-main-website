import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReveal } from '../hooks/useReveal'
import { useRobotMood } from '../context/RobotMood'
import Eyebrow from './Eyebrow'
import {
  AREAS,
  BELIEFS,
  MODELS,
  QUIZ,
  STATUS_LABEL,
  TEAM_SIZES,
  VERIFY_SCALE,
  buildPlan,
  cleanOtherBusiness,
  nounsFor,
  verifyTarget,
  whatsappLink,
  type QuizAnswers,
  type Status,
} from '../content/quiz'
import { site } from '../config/site'

type Draft = {
  model?: string
  otherBusiness?: string
  team?: number
  belief?: string
  answers: number[]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const option =
  'group flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-[15px] text-ink transition-all duration-200 hover:border-glass/50 hover:bg-white focus-visible:border-glass'
const optionIdle = 'border-black/[0.08] bg-white/70'
const optionOn = 'border-glass bg-white shadow-[inset_0_0_0_1px_rgba(45,109,139,1)]'
const goldButton =
  'inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-ink shadow-brand transition-colors duration-300 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50'
const blueButton =
  'inline-flex items-center gap-2 rounded-full border border-glass/30 px-6 py-3 text-[14px] font-semibold text-glass-600 transition-colors duration-300 hover:border-glass hover:bg-white'
const quiet = '-my-2 py-2 text-[13.5px] font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline'

/**
 * The quiz: what kind of business, how big, what they think is wrong, then
 * what actually happens at each stage of the work, and one check against
 * their own records on the stage that stands out. The plan follows straight
 * away; the email comes after, for those who want a copy.
 */
function FixPlan({ onExit }: { onExit: () => void }) {
  const [draft, setDraft] = useState<Draft>({ answers: [] })
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<QuizAnswers | null>(null)
  const headRef = useRef<HTMLHeadingElement>(null)

  const steps = ['model', 'team', 'belief', ...AREAS.map((_, i) => `area-${i}`), 'verify']
  const current = steps[step]
  const n = nounsFor(draft.model ?? 'other')
  const solo = draft.team === 0

  // keyboard and screen reader users land on each new question
  useEffect(() => {
    const heading = headRef.current
    const dialog = heading?.closest('dialog')
    if (dialog) dialog.scrollTop = 0
    heading?.focus({ preventScroll: true })
  }, [step, plan])

  const next = (change: Partial<Draft> = {}) => {
    setDraft((d) => ({ ...d, ...change }))
    setStep((s) => s + 1)
  }
  const back = () => (step === 0 ? onExit() : setStep(step - 1))
  const restart = () => {
    setDraft({ answers: [] })
    setPlan(null)
    setStep(0)
  }
  const finish = (answers: number[], extra: number | null) =>
    setPlan({ model: draft.model!, ...(draft.model === 'other' && draft.otherBusiness ? { otherBusiness: draft.otherBusiness } : {}), team: draft.team!, belief: draft.belief!, answers, extra })

  if (plan) return <PlanView answers={plan} headRef={headRef} onRestart={restart} />

  const choose = (items: { text: string; hint?: string }[], picked: number | undefined, onPick: (i: number) => void) => (
    <div className="mt-6 grid gap-2.5">
      {items.map((item, i) => (
        <button key={item.text} type="button" onClick={() => onPick(i)} className={`${option} ${picked === i ? optionOn : optionIdle}`}>
          <span>
            {item.text}
            {item.hint && <span className="mt-0.5 block text-[13px] text-ink-muted">{item.hint}</span>}
          </span>
          <span className="text-glass opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  )

  let label = ''
  let question: ReactNode = null
  let note: ReactNode = null
  let body: ReactNode = null

  if (current === 'model') {
    label = 'Your business'
    question = 'What kind of business do you run?'
    body = (
      <>
        {choose(MODELS.map((m) => ({ text: m.label, hint: m.hint })), MODELS.findIndex((m) => m.id === draft.model), (i) => {
          const model = MODELS[i].id
          if (model === 'other') setDraft((d) => ({ ...d, model }))
          else next({ model, otherBusiness: undefined })
        })}
        {draft.model === 'other' && (
          <form className="mt-5" onSubmit={(event) => {
            event.preventDefault()
            const otherBusiness = cleanOtherBusiness(draft.otherBusiness)
            if (otherBusiness) next({ otherBusiness })
          }}>
            <label htmlFor="other-business" className="block text-[14px] font-semibold text-ink">Tell us a little about your business</label>
            <input
              id="other-business"
              type="text"
              required
              maxLength={80}
              autoFocus
              value={draft.otherBusiness ?? ''}
              onChange={(event) => setDraft((d) => ({ ...d, otherBusiness: event.target.value }))}
              placeholder="For example, a catering business"
              className="mt-2 w-full rounded-2xl border border-black/[0.1] bg-white/80 px-5 py-4 text-[15px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-glass"
            />
            <button type="submit" disabled={!cleanOtherBusiness(draft.otherBusiness)} className={`${goldButton} mt-4`}>
              Continue <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </>
    )
  } else if (current === 'team') {
    label = 'Your business'
    question = 'How many people work in it, including you?'
    body = choose(TEAM_SIZES.map((text) => ({ text })), draft.team, (i) => next({ team: i }))
  } else if (current === 'belief') {
    label = 'Your business'
    question = 'What frustrates you most right now?'
    note = 'Pick the one closest. We’ll compare it with what your answers show.'
    body = choose(BELIEFS.map((b) => ({ text: b.label })), BELIEFS.findIndex((b) => b.id === draft.belief), (i) => next({ belief: BELIEFS[i].id }))
  } else if (current.startsWith('area-')) {
    const i = Number(current.slice(5))
    const area = AREAS[i]
    label = area.stage
    question = area.question(n, solo)
    body = choose(area.options(n, solo), draft.answers[i], (pick) => {
      const answers = AREAS.map((_, j) => (j === i ? pick : draft.answers[j]))
      // with nothing standing out there is nothing to check
      if (i === AREAS.length - 1 && !verifyTarget({ model: draft.model!, team: draft.team!, belief: draft.belief!, answers })) {
        setDraft((d) => ({ ...d, answers }))
        finish(answers, null)
      } else next({ answers })
    })
  } else {
    const area = verifyTarget({ model: draft.model!, team: draft.team!, belief: draft.belief!, answers: draft.answers })!
    label = `Check: ${area.stage.toLowerCase()}`
    question = area.verify(n, solo)
    note = 'If you can, look at your messages or records rather than guessing. It’s fine if you can’t.'
    body = choose(VERIFY_SCALE, undefined, (pick) => finish(draft.answers, pick))
  }

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-glass">{label}</p>
        <p className="text-[12.5px] tabular-nums text-ink-muted">
          {step + 1} of {steps.length}
        </p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-glass-100" aria-hidden="true">
        <div className="h-full rounded-full bg-glass transition-[width] duration-500 ease-out" style={{ width: `${(step / steps.length) * 100}%` }} />
      </div>

      <h3 ref={headRef} tabIndex={-1} className="mt-8 font-display text-[clamp(1.45rem,2.6vw,1.95rem)] leading-[1.2] tracking-[-0.015em] text-ink outline-none">
        {question}
      </h3>
      {note && <p className="mt-2 text-[14px] text-ink-muted">{note}</p>}
      {body}

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-black/[0.07] pt-5">
        <button type="button" onClick={back} className={quiet}>
          ← {step === 0 ? 'Back' : 'Previous'}
        </button>
      </div>
    </div>
  )
}

/** A section of the plan, set off by a hairline. */
function PlanSection({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`mt-10 border-t border-black/[0.08] pt-8 ${className}`}>
      <h4 className="font-display text-[1.35rem] leading-snug text-ink">{title}</h4>
      {children}
    </section>
  )
}

const STATUS_TONE: Record<Status, string> = {
  first: 'font-semibold text-brand-600',
  risk: 'font-medium text-brand-600',
  some: 'text-ink-soft',
  working: 'text-glass-600',
  unclear: 'italic text-ink-muted',
  na: 'italic text-ink-muted',
}

/** The marker for a stage on the journey: its colour and fill say how it is going. */
function StageMark({ status }: { status: Status }) {
  if (status === 'first') {
    return (
      <span className="relative grid h-7 w-7 place-items-center" aria-hidden="true">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/30 [animation-duration:2.4s] motion-reduce:animate-none" />
        <span className="absolute inset-0 rounded-full bg-brand/25" />
        <span className="h-4 w-4 rounded-full bg-brand shadow-[0_0_0_3px_#fff]" />
      </span>
    )
  }
  const style: Record<Exclude<Status, 'first'>, string> = {
    working: 'bg-glass',
    some: 'border-2 border-brand bg-cream',
    risk: 'bg-brand',
    unclear: 'border-2 border-dashed border-ink-muted/50 bg-cream',
    na: 'border border-black/15 bg-cream',
  }
  return (
    <span className="grid h-7 w-7 place-items-center" aria-hidden="true">
      <span className={`h-3 w-3 rounded-full shadow-[0_0_0_3px_#F8F5F0] ${style[status]}`} />
    </span>
  )
}

/**
 * The plan, made to be read in a minute: what to fix first, the business
 * drawn as a journey with each stage marked, how one weak point feeds
 * another, why it matters, then two steps: check it, then fix it, simplest
 * first. The answers behind it and what we couldn't tell come after, then
 * the call, and a copy by email for those who want one.
 */
function PlanView({ answers, headRef, onRestart }: {
  answers: QuizAnswers
  headRef: React.RefObject<HTMLHeadingElement>
  onRestart: () => void
}) {
  const p = buildPlan(answers)
  const [lead, setLead] = useState({ name: '', email: '', marketing: false })
  const [sent, setSent] = useState<'sending' | 'sent' | 'failed' | null>(null)
  const planRef = useRef<HTMLDivElement>(null)
  const valid = lead.name.trim() && EMAIL.test(lead.email.trim())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent('sending')
    // the plan is already on the page; this only sends the copy (see docs/quiz-backend.md)
    fetch(`${site.apiBaseUrl}/api/quiz-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: lead.name.trim(), email: lead.email.trim(), marketing: lead.marketing, answers }),
    })
      .then(async (res) => setSent(res.ok && (await res.json()).ok ? 'sent' : 'failed'))
      .catch(() => setSent('failed'))
  }

  // Print a normal-flow copy outside the modal's scrolling and clipping
  // containers, so the browser can paginate the entire plan into a PDF.
  const printPlan = () => {
    if (!planRef.current) return
    const existing = document.querySelector('.quiz-print')
    existing?.remove()
    const printRoot = document.createElement('div')
    printRoot.className = 'quiz-print'
    printRoot.setAttribute('aria-hidden', 'true')
    const copy = planRef.current.cloneNode(true) as HTMLElement
    copy.querySelectorAll('.quiz-plan__actions').forEach((section) => section.remove())
    printRoot.appendChild(copy)
    document.body.appendChild(printRoot)
    document.body.classList.add('printing-quiz-plan')

    let timeout: number | undefined
    const cleanup = () => {
      printRoot.remove()
      document.body.classList.remove('printing-quiz-plan')
      window.removeEventListener('afterprint', cleanup)
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
    window.addEventListener('afterprint', cleanup, { once: true })
    // Some browsers do not fire afterprint when the dialog is dismissed.
    timeout = window.setTimeout(cleanup, 60000)
    try {
      window.print()
    } catch (error) {
      cleanup()
      throw error
    }
  }

  const count = (...s: Status[]) => p.map.filter((row) => s.includes(row.status)).length
  const glance = [
    { n: count('working'), label: 'working well', tone: 'text-glass-600' },
    { n: count('some', 'risk'), label: 'worth watching', tone: 'text-brand-600' },
    { n: count('first'), label: 'to fix first', tone: 'text-brand-600' },
    { n: count('unclear'), label: 'not sure', tone: 'text-ink-muted' },
  ].filter((g) => g.n > 0)

  const field = 'mt-1.5 w-full rounded-xl border border-black/[0.1] bg-white/80 px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus:border-glass'
  const step = 'font-display text-[2.4rem] leading-none text-brand-600'

  return (
    <div ref={planRef} className="quiz-plan w-full text-left">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-glass">Your business fix plan</p>
      {answers.model === 'other' && answers.otherBusiness && (
        <p className="mt-4 text-[14px] font-light leading-relaxed text-ink-soft">Business: {answers.otherBusiness}</p>
      )}
      {p.area && <p className="mt-4 text-[14px] font-semibold text-brand-600">Fix first: {p.area.stage.toLowerCase()}</p>}
      <h3 ref={headRef} tabIndex={-1} className="mt-2 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.08] tracking-[-0.02em] text-ink outline-none">
        {p.headline}
      </h3>
      <p className="mt-4 max-w-xl font-display text-[1.15rem] italic leading-snug text-glass-600">{p.compare}</p>
      {p.tentative && (
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
          You weren’t sure about several answers, so treat this as a first read.
        </p>
      )}

      {/* ---------- At a glance ---------- */}
      <dl className="mt-8 grid border-t border-black/[0.08] pt-5" style={{ gridTemplateColumns: `repeat(${glance.length}, minmax(0, 1fr))` }}>
        {glance.map((g, i) => (
          <div key={g.label} className={i > 0 ? 'border-l border-black/[0.08] pl-3 sm:pl-6' : ''}>
            <dt className="sr-only">{g.label}</dt>
            <dd>
              <span className={`block font-display text-[2.4rem] leading-none ${g.tone}`}>{g.n}</span>
              <span className="mt-1.5 block text-[13px] text-ink-muted">{g.label}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* ---------- The business as a journey ---------- */}
      <PlanSection title="Where things stand">
        <p className="mt-1.5 text-[14px] text-ink-muted">Your business from the first enquiry to the work running without you.</p>
        <ol className="relative mt-6">
          <span className="absolute bottom-3.5 left-[13px] top-3.5 w-[2px] rounded-full bg-gradient-to-b from-brand/60 via-glass/40 to-glass/60" aria-hidden="true" />
          {p.map.map((row) => {
            const first = row.status === 'first'
            return (
              <li key={row.stage} className={`relative grid grid-cols-[28px_1fr_auto] items-center gap-x-4 ${first ? 'py-3' : 'py-2'}`}>
                <StageMark status={row.status} />
                <span className={first ? 'font-display text-[1.2rem] text-ink' : 'text-[15px] text-ink'}>{row.stage}</span>
                <span className={`text-[13.5px] ${STATUS_TONE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
              </li>
            )
          })}
        </ol>
      </PlanSection>

      {/* ---------- How one weak point feeds another ---------- */}
      {p.connection && (
        <PlanSection title="How one problem feeds another">
          <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="font-display text-[1.2rem] text-ink">{p.connection.from}</span>
            <svg viewBox="0 0 90 14" className="hidden h-3.5 w-[90px] shrink-0 sm:block" fill="none" aria-hidden="true">
              <path d="M1 7h84M78 1.5 86.5 7 78 12.5" stroke="#E1AD34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg viewBox="0 0 14 40" className="ml-3 h-10 w-3.5 sm:hidden" fill="none" aria-hidden="true">
              <path d="M7 1v34M1.5 28.5 7 37l5.5-8.5" stroke="#E1AD34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-[1.2rem] text-ink">{p.connection.to}</span>
          </div>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">{p.connection.line}</p>
        </PlanSection>
      )}

      <PlanSection title="Why it matters">
        <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-ink">{p.why}</p>
      </PlanSection>

      {/* ---------- What to do: two steps ---------- */}
      <PlanSection title="What to do next">
        <div className="mt-6 grid grid-cols-[3rem_1fr] gap-x-3">
          <span className={step}>1</span>
          <div>
            <p className="text-[16px] font-semibold text-ink">Check it on your own records</p>
            <p className="text-[13.5px] text-ink-muted">About 20 minutes</p>
            <ul className="mt-3 grid gap-2.5">
              {p.check.map((item) => (
                <li key={item} className="border-l-2 border-brand/50 pl-4 text-[15px] leading-relaxed text-ink">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-[3rem_1fr] gap-x-3">
          <span className={step}>2</span>
          <div>
            <p className="text-[16px] font-semibold text-ink">Fix it, simplest way first</p>
            <div className="mt-3 grid gap-6 sm:grid-cols-2 sm:gap-0">
              <div className="sm:pr-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-glass">Start here</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">{p.simple}</p>
              </div>
              <div className="border-t border-black/[0.08] pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">If that isn’t enough</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{p.bigger}</p>
                <a href={p.see.href} className="mt-3 inline-block text-[13.5px] font-semibold text-glass-600 underline decoration-glass/30 underline-offset-4 hover:decoration-glass">
                  {p.see.label} →
                </a>
              </div>
            </div>
          </div>
        </div>
      </PlanSection>

      {p.evidence.length > 0 && (
        <PlanSection title="Based on what you told us">
          <ul className="mt-4 grid gap-4">
            {p.evidence.map((e) => (
              <li key={e.question} className="text-[14.5px] leading-relaxed">
                <span className="block text-ink-muted">{e.question}</span>
                <span className="mt-0.5 block font-display text-[1.05rem] text-ink">“{e.answer}”</span>
              </li>
            ))}
          </ul>
        </PlanSection>
      )}

      {p.unclear.length > 0 && (
        <PlanSection title="What we couldn’t tell">
          <ul className="mt-4 grid gap-3">
            {p.unclear.map((item) => (
              <li key={item} className="max-w-xl text-[14.5px] leading-relaxed text-ink-soft">{item}</li>
            ))}
          </ul>
        </PlanSection>
      )}

      <PlanSection title={QUIZ.close.heading} className="quiz-plan__actions">
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">{QUIZ.close.body}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href={site.links.booking} target="_blank" rel="noopener noreferrer" className={goldButton}>
            Book a consultation <span aria-hidden="true">↗</span>
          </a>
          <a href={whatsappLink(answers)} target="_blank" rel="noopener noreferrer" className={blueButton}>
            Send it to us on WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <button type="button" onClick={printPlan} className={quiet}>
            Save as PDF
          </button>
        </div>
      </PlanSection>

      <PlanSection title={QUIZ.email.heading} className="quiz-plan__actions">
        {sent === 'sent' ? (
          <p className="mt-3 text-[15px] text-ink" aria-live="polite">Sent. Your plan is on its way to {lead.email.trim()}.</p>
        ) : (
          <form onSubmit={submit} className="mt-3">
            <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">{QUIZ.email.body}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-[13px] font-semibold text-ink">
                First name
                <input required autoComplete="given-name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value.slice(0, 60) })} className={field} />
              </label>
              <label className="text-[13px] font-semibold text-ink">
                Email
                <input required type="email" autoComplete="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value.slice(0, 160) })} className={field} />
              </label>
            </div>
            <label className="mt-4 flex max-w-xl items-start gap-3 text-[13.5px] leading-relaxed text-ink-soft">
              <input type="checkbox" checked={lead.marketing} onChange={(e) => setLead({ ...lead, marketing: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-[#2D6D8B]" />
              {QUIZ.email.marketing}
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={!valid || sent === 'sending'} className={goldButton}>
                {QUIZ.email.action} <span aria-hidden="true">→</span>
              </button>
              <p className="text-[13.5px] text-ink-muted" aria-live="polite">
                {sent === 'failed' && 'We couldn’t send it just now. Save it as a PDF to keep it.'}
              </p>
            </div>
          </form>
        )}
        <button type="button" onClick={onRestart} className={`${quiet} mt-6`}>
          Start again
        </button>
      </PlanSection>
    </div>
  )
}

/**
 * Large outlined question mark that draws itself on scroll.
 * The glyph is a single continuous stroke plus a separate dot, so the draw
 * reads as one confident pen movement.
 */
function DrawnQuestionMark({ active }: { active: boolean }) {
  const hookRef = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(0)

  useEffect(() => {
    if (hookRef.current) setLen(hookRef.current.getTotalLength())
  }, [])

  return (
    <svg
      viewBox="0 0 120 160"
      className="h-[104px] w-auto sm:h-[132px]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cc-q-grad" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#EBC96D" />
          <stop offset="55%" stopColor="#E1AD34" />
          <stop offset="100%" stopColor="#C9962A" />
        </linearGradient>
        <filter id="cc-q-glow" x="-60%" y="-40%" width="220%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#cc-q-glow)">
        {/* Hook + stem, one continuous path */}
        <path
          ref={hookRef}
          d="M27 47c0-19 15-32 34-32s33 12 33 30c0 22-21 26-29 39-4 6-5 12-5 20"
          stroke="url(#cc-q-grad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: len || 1,
            strokeDashoffset: active ? 0 : len || 1,
            transition: 'stroke-dashoffset 1400ms cubic-bezier(0.65, 0, 0.35, 1) 120ms',
          }}
        />
        {/* Dot */}
        <circle
          cx="60"
          cy="140"
          r="7.5"
          fill="url(#cc-q-grad)"
          style={{
            opacity: active ? 1 : 0,
            transform: active ? 'scale(1)' : 'scale(0.2)',
            transformOrigin: '60px 140px',
            transition:
              'opacity 400ms ease 1250ms, transform 600ms cubic-bezier(0.34,1.56,0.64,1) 1250ms',
          }}
        />
      </g>
    </svg>
  )
}

export default function Quiz() {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.25 })
  const { moodHandlers } = useRobotMood()
  const [taking, setTaking] = useState(false)
  const startRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!taking || !dialog) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true })
    return () => { document.body.style.overflow = previousOverflow }
  }, [taking])

  const exit = () => {
    setTaking(false)
    requestAnimationFrame(() => startRef.current?.focus())
  }

  const rise = (delay: number) => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <section id="quiz" aria-label={`${QUIZ.heading} ${QUIZ.emphasis}`} className="relative w-full bg-cream pb-14 pt-6 md:pb-[clamp(48px,7vh,72px)] md:pt-8">
      {/* ---------- Ambient blue wash ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute left-1/2 top-1/4 h-[520px] w-[860px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse, rgba(45,109,139,0.05) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
        <div
          className="absolute -right-28 bottom-0 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div
          className="relative isolate overflow-hidden rounded-[28px] border border-white/70 px-6 py-12 text-center shadow-[0_40px_100px_-40px_rgba(18,44,56,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[36px] sm:px-12 md:py-12"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.60) 0%, rgba(45,109,139,0.045) 45%, rgba(45,109,139,0.06) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          {/* Specular top edge */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 45%, transparent)',
            }}
            aria-hidden="true"
          />

          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <div style={rise(0)}>
              <DrawnQuestionMark active={revealed} />
            </div>

            <Eyebrow className="mt-5 justify-center" style={rise(120)}>
              {QUIZ.label}
            </Eyebrow>

            <h2
              className="mt-4 font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-balance text-ink"
              style={rise(200)}
            >
              {QUIZ.heading}{' '}
              <span className="italic text-brand-600">{QUIZ.emphasis}</span>
            </h2>

            <p
              className="mt-4 max-w-xl text-[clamp(0.98rem,1.1vw,1.06rem)] font-light leading-relaxed text-ink-soft"
              style={rise(280)}
            >
              {QUIZ.intro}
            </p>

            <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[13.5px] font-medium text-glass-600" style={rise(320)}>
              {QUIZ.points.map((point) => <span key={point}>{point}</span>)}
            </p>

            <div className="mt-7" style={rise(360)}>
              <button
                ref={startRef}
                type="button"
                onClick={() => setTaking(true)}
                {...moodHandlers('happy')}
                className="group inline-flex items-center gap-2.5 rounded-full bg-brand px-8 py-4 text-[15px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_22px_40px_-14px_rgba(225,173,52,0.85)] active:translate-y-0"
              >
                {QUIZ.action}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
              <p className="mt-3 text-[12.5px] text-ink-muted">{QUIZ.meta}</p>
            </div>
          </div>
        </div>
      </div>
      {taking && createPortal(
        <dialog
          ref={dialogRef}
          aria-label={`${QUIZ.heading} ${QUIZ.emphasis}`}
          onCancel={(event) => { event.preventDefault(); exit() }}
          className="quiz-dialog fixed inset-0 m-auto h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 bg-cream p-0 text-ink shadow-soft sm:h-auto sm:max-h-[min(90dvh,900px)] sm:w-[min(720px,calc(100%-3rem))] sm:rounded-[32px]"
        >
          <div className="relative mx-auto max-w-2xl px-6 pb-10 pt-16 sm:px-10 sm:pb-12 sm:pt-16">
            <button
              type="button"
              onClick={exit}
              aria-label="Close quiz"
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink transition-colors duration-300 hover:border-glass/40 hover:bg-white sm:right-7 sm:top-6"
            >
              <span aria-hidden="true" className="text-[24px] leading-none">×</span>
            </button>
            <FixPlan onExit={exit} />
          </div>
        </dialog>,
        document.body,
      )}
    </section>
  )
}
