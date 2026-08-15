import { useEffect, useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import { useRobotMood } from '../context/RobotMood'
import Eyebrow from './Eyebrow'

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

  const rise = (delay: number) => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <section id="quiz" className="relative w-full bg-cream pb-24 pt-8 md:pb-32 md:pt-12">
      {/* ---------- Ambient warm wash ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute left-1/2 top-1/4 h-[520px] w-[860px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse, rgba(225,173,52,0.30) 0%, rgba(225,173,52,0) 70%)',
          }}
        />
        <div
          className="absolute -right-28 bottom-0 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(235,201,109,0.34) 0%, rgba(235,201,109,0) 70%)',
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div
          className="relative isolate overflow-hidden rounded-[28px] border border-white/70 px-6 py-16 text-center shadow-[0_40px_100px_-40px_rgba(74,54,15,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[36px] sm:px-12 md:py-20"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.60) 0%, rgba(250,239,210,0.36) 45%, rgba(243,221,161,0.42) 100%)',
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

            <Eyebrow className="mt-8 justify-center" style={rise(120)}>
              Free Check-Up
            </Eyebrow>

            <h2
              className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.07] tracking-[-0.02em] text-balance text-ink"
              style={rise(200)}
            >
              Take the Business Foundation{' '}
              <span className="italic text-brand-600">Check-Up Quiz</span>
            </h2>

            <p
              className="mt-5 max-w-xl text-[clamp(0.98rem,1.2vw,1.1rem)] font-light leading-relaxed text-ink-soft"
              style={rise(280)}
            >
              Find out how you’re really running your business, what’s working, what’s messy, and
              what needs fixing. Built especially for founders who do it all.
            </p>

            <div className="mt-9" style={rise(360)}>
              <a
                href="#take-quiz"
                {...moodHandlers('happy')}
                className="group inline-flex items-center gap-2.5 rounded-full bg-brand px-8 py-4 text-[15px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_22px_40px_-14px_rgba(225,173,52,0.85)] active:translate-y-0"
              >
                Take the Quiz
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
