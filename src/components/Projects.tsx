import { useRobotMood } from '../context/RobotMood'
import { useReveal } from '../hooks/useReveal'
import Underline from './Underline'
import Eyebrow from './Eyebrow'

/**
 * Looping robot animation, re-encoded from the uncropped source GIF
 * ("robot c&c.gif", 21.7 MB) to VP9/WebM with an alpha channel (~420 KB).
 * Unlike the previous export, the robot never touches the video frame edge,
 * so nothing gets cut off while it floats.
 */
const ROBOT_LOOP_SRC = '/robot-working.webm'
const ROBOT_POSTER_SRC = '/robot-working-poster.png'

export default function Projects() {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.25 })
  const { moodHandlers } = useRobotMood()

  const rise = (delay: number) => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(26px)',
    transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <section id="projects" className="relative w-full bg-cream py-24 md:py-32">
      {/* ---------- Ambient blue wash ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute -left-40 top-10 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
        <div
          className="absolute -right-32 bottom-0 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            {/* ---------- Left: floating robot (free of any clipping container) ---------- */}
            <div
              className="relative order-1 flex justify-center overflow-visible"
              style={rise(0)}
            >
              {/* Soft pedestal glow */}
              <div
                className="pointer-events-none absolute bottom-2 left-1/2 h-20 w-[240px] -translate-x-1/2 rounded-[50%] blur-2xl"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)',
                }}
                aria-hidden="true"
              />

              <video
                src={ROBOT_LOOP_SRC}
                poster={ROBOT_POSTER_SRC}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                width={500}
                height={600}
                aria-label="The Clause & Code robot at work, building systems"
                className="relative block h-auto w-full max-w-[230px] animate-float object-contain drop-shadow-[0_30px_50px_rgba(18,44,56,0.18)] sm:max-w-[260px] lg:max-w-[300px]"
              />
            </div>

            {/* ---------- Right: copy ---------- */}
            <div className="order-2">
              <Eyebrow style={rise(80)}>Our Projects</Eyebrow>

              <h2
                className="mt-6 font-display text-[clamp(2.1rem,4.2vw,3.5rem)] leading-[1.06] tracking-[-0.02em] text-ink"
                style={rise(150)}
              >
                Real work.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 italic text-brand-600">Real transformation.</span>
                  <Underline active={revealed} delay={700} />
                </span>
              </h2>

              <p
                className="mt-6 max-w-xl text-[clamp(0.98rem,1.2vw,1.1rem)] font-light leading-relaxed text-ink-soft"
                style={rise(240)}
              >
                See how we have helped founders and growing businesses build scalable systems,
                reduce operational chaos, and create backend structures that support long-term
                growth. Each project reflects our focus on clarity, efficiency, and sustainable
                systems.
              </p>

              <div className="mt-9" style={rise(330)}>
                <a
                  href="#projects-index"
                  {...moodHandlers('happy')}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_22px_40px_-14px_rgba(225,173,52,0.85)] active:translate-y-0"
                >
                  View Our Projects
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
