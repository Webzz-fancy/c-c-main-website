import { useEffect, useRef, useState } from 'react'
import Eyebrow from './Eyebrow'
import { Bot } from './complex/AgentLab'
import { HOME_DAY } from '../content/home'
import './home.css'

// how far each moment slips out of line while the day is a mess
const TILT = [
  { r: -1.8, x: -10 },
  { r: 1.4, x: 14 },
  { r: -0.9, x: -18 },
  { r: 2, x: 8 },
  { r: -1.3, x: 16 },
]

/**
 * One ordinary day, twice. "Today" is a pile of slips, each a little out of
 * line; flip the switch and they snap into place, each one handled by an
 * agent or a system, while the broom robot sweeps across. The switch flips
 * itself once, the first time the section comes into view, so the change is
 * seen even by someone who never touches it.
 */
export default function SameDay() {
  const [on, setOn] = useState(false)
  const [sweeps, setSweeps] = useState(0)
  const touched = useRef(false)
  const ref = useRef<HTMLElement>(null)

  const flip = (next: boolean) => {
    setOn(next)
    if (next) setSweeps((n) => n + 1)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        timer = window.setTimeout(() => {
          if (!touched.current) flip(true)
        }, 1600)
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <section ref={ref} id="your-day" className="same-day relative w-full overflow-hidden bg-cream" data-on={on ? '' : undefined}>
      <div className="same-day__inner mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div className="same-day__intro">
          <Eyebrow>{HOME_DAY.label}</Eyebrow>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-ink">
            {HOME_DAY.heading} <span className="italic text-brand-600">{HOME_DAY.emphasis}</span>
          </h2>
          <p className="mt-4 text-[clamp(0.98rem,1.1vw,1.06rem)] font-light leading-relaxed text-ink-soft">{HOME_DAY.intro}</p>

          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => {
              touched.current = true
              flip(!on)
            }}
            className="same-day__switch mt-7"
          >
            <span className="same-day__side" data-active={!on ? '' : undefined}>{HOME_DAY.off}</span>
            <span className="same-day__track" aria-hidden="true"><span className="same-day__knob" /></span>
            <span className="same-day__side" data-active={on ? '' : undefined}>{HOME_DAY.on}</span>
          </button>

          <p className="same-day__note mt-6 text-[14px] leading-relaxed text-ink-soft">{HOME_DAY.note}</p>
        </div>

        <ol className="same-day__list" aria-live="polite">
          {HOME_DAY.moments.map((m, i) => (
            <li
              key={m.time}
              className="same-day__slip"
              style={{ '--r': `${TILT[i % TILT.length].r}deg`, '--x': `${TILT[i % TILT.length].x}px`, '--d': `${i * 70}ms` } as React.CSSProperties}
            >
              <time className="same-day__time">{m.time}</time>
              <p className="same-day__text">{on ? m.after : m.today}</p>
              <span className="same-day__who" aria-hidden={!on}>
                <Bot glyph={m.glyph} className="same-day__bot" />
                {m.who}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* a fresh sweep each time the day is tidied */}
      {sweeps > 0 && (
        <img key={sweeps} className="same-day__broom" src="/robot-broom.webp" alt="" aria-hidden="true" width={579} height={640} decoding="async" />
      )}
    </section>
  )
}
