import { useEffect, useState } from 'react'
import HeroRobot from './HeroRobot'
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
      {/* ---------- Ambient background: warm / cool opposite diagonals ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-70" />
        {/* Orangish corner — top right, behind the robot */}
        <div
          className="absolute -right-40 -top-32 h-[640px] w-[760px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(225,173,52,0.16) 0%, rgba(225,173,52,0) 68%)',
          }}
        />
        {/* Bluish corner — bottom left, opposite diagonal */}
        <div
          className="absolute -bottom-36 -left-40 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(45,109,139,0.10) 0%, rgba(45,109,139,0) 68%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.07] to-transparent" />
      </div>

      {/* ---------- Two-side composition: copy | robot ---------- */}
      <div className="relative z-10 mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-x-10 px-6 pt-[104px] md:pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-1">
        {/* ----- Copy ----- */}
        <div className="flex flex-col items-center text-center lg:items-start lg:justify-center lg:pb-[7vh] lg:text-left">
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
            className="animate-fade-up mt-[clamp(1.1rem,3vh,2rem)] flex w-full flex-row items-center justify-center gap-2 sm:w-auto sm:gap-3 lg:justify-start"
            style={{ animationDelay: '280ms' }}
          >
            <a
              href="#approach"
              className="group inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-3 py-2.5 text-[12px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_22px_40px_-14px_rgba(225,173,52,0.85)] active:translate-y-0 sm:flex-none sm:gap-2 sm:px-7 sm:py-3.5 sm:text-[15px]"
            >
              See Our Approach
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>

            <a
              href="#book-consultation"
              {...moodHandlers('happy')}
              className="group inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-ink/20 bg-white/50 px-3 py-2.5 text-[12px] font-semibold text-ink backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:bg-white hover:shadow-[0_18px_34px_-18px_rgba(27,26,23,0.5)] active:translate-y-0 sm:flex-none sm:gap-2 sm:px-7 sm:py-3.5 sm:text-[15px]"
            >
              Book a Consultation
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-brand transition-transform duration-300 group-hover:scale-150"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        {/* ----- Robot ----- */}
        <div className="relative flex min-h-0 items-end justify-center pb-[1.5vh] pt-4 lg:pb-[3vh] lg:pt-0">
          <div className="animate-fade-in aspect-[715/1391] h-full max-h-[46vh] lg:max-h-[min(76vh,680px)]" style={{ animationDelay: '240ms' }}>
            <HeroRobot />
          </div>
        </div>
      </div>
    </section>
  )
}
