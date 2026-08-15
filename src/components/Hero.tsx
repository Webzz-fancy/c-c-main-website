import { useEffect, useState } from 'react'
import RobotHead from './RobotHead'
import Underline from './Underline'
import { useRobotMood } from '../context/RobotMood'

export default function Hero() {
  const { moodHandlers } = useRobotMood()

  // The hero is visible on load; delay the underline so it draws after the
  // headline has finished animating in.
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 620)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[680px] w-full flex-col overflow-hidden bg-cream"
    >
      {/* ---------- Ambient background ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-70" />
        <div
          className="absolute -top-40 left-1/2 h-[620px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(225,173,52,0.20) 0%, rgba(225,173,52,0) 68%)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[420px] w-[1200px] -translate-x-1/2 blur-2xl"
          style={{
            background:
              'radial-gradient(ellipse at bottom, rgba(225,173,52,0.22) 0%, rgba(248,245,240,0) 70%)',
          }}
        />
        <div
          className="absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(235,201,109,0.30) 0%, rgba(235,201,109,0) 70%)',
          }}
        />
        <div
          className="absolute -right-28 top-1/3 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(225,173,52,0.18) 0%, rgba(225,173,52,0) 70%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.07] to-transparent" />
      </div>

      {/* ---------- Centred content ---------- */}
      <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 pt-[104px] md:pt-28">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1
            className="animate-fade-up font-display text-[clamp(2rem,min(5.6vw,7vh),4.15rem)] font-normal leading-[1.04] tracking-[-0.02em] text-balance text-ink"
            style={{ animationDelay: '80ms' }}
          >
            We build the{' '}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-brand-600">operating system</span>
              <Underline active={drawn} />
            </span>{' '}
            behind your growth.
          </h1>

          <p
            className="animate-fade-up mt-[clamp(0.75rem,2.1vh,1.35rem)] max-w-xl text-[clamp(0.92rem,min(1.3vw,1.85vh),1.08rem)] font-light leading-relaxed text-ink-soft text-balance"
            style={{ animationDelay: '180ms' }}
          >
            We start with process mapping because the right solution only comes from
            understanding how your business actually works. Once we map your operations, we create
            custom systems, help you adopt the right tools, and make you ready for intelligent
            automation.
          </p>

          <div
            className="animate-fade-up mt-[clamp(1.1rem,3vh,2rem)] flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: '280ms' }}
          >
            <a
              href="#approach"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_22px_40px_-14px_rgba(225,173,52,0.85)] active:translate-y-0"
            >
              See Our Approach
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>

            <a
              href="#book-consultation"
              {...moodHandlers('happy')}
              className="group inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white/50 px-7 py-3.5 text-[15px] font-semibold text-ink backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:bg-white hover:shadow-[0_18px_34px_-18px_rgba(27,26,23,0.5)] active:translate-y-0"
            >
              Book a Consultation
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-brand transition-transform duration-300 group-hover:scale-150"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>

      {/* ---------- Robot head, bottom centre ---------- */}
      <div className="relative z-0 flex shrink-0 justify-center overflow-visible">
        <div className="aspect-[554/394] h-[min(46vh,calc(94vw*394/554))] max-h-[560px]">
          <RobotHead />
        </div>
      </div>
    </section>
  )
}
