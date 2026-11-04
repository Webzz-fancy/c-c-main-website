import { useEffect, useRef, useState } from 'react'
import Eyebrow from './Eyebrow'
import { Bot } from './complex/AgentLab'
import { HOME_ABILITIES, YOU_TOKEN } from '../content/home'
import './home.css'

const { items } = HOME_ABILITIES

/**
 * The four ways we put AI to work, shown rather than described: pick one on
 * the left and its screen on the right plays out what it does for you. Until
 * the reader picks one, the tabs move on by themselves while the section is
 * in view. The section keeps the header's "Ways We Help" anchor.
 */
export default function Abilities() {
  const [active, setActive] = useState(0)
  const touched = useRef(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer)
      if (!entry.isIntersecting || touched.current) return
      timer = window.setInterval(() => {
        if (touched.current) return window.clearInterval(timer)
        setActive((n) => (n + 1) % items.length)
      }, 6000)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [])

  const pick = (i: number) => {
    touched.current = true
    setActive(i)
  }
  // arrow keys move between the tabs, as they do in any tab list
  const onKey = (e: React.KeyboardEvent) => {
    const way = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!way) return
    e.preventDefault()
    const next = (active + way + items.length) % items.length
    pick(next)
    document.getElementById(`ability-tab-${next}`)?.focus()
  }

  const item = items[active]

  return (
    <section ref={ref} id="ways-we-help" className="abilities relative w-full bg-cream">
      <div className="abilities__inner mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div>
          <Eyebrow>{HOME_ABILITIES.label}</Eyebrow>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,3.6vw,3.3rem)] leading-[1.05] tracking-[-0.02em] text-ink">
            {HOME_ABILITIES.heading} <span className="italic text-brand-600">{HOME_ABILITIES.emphasis}</span>
          </h2>
          <p className="mt-4 text-[clamp(0.98rem,1.1vw,1.06rem)] font-light leading-relaxed text-ink-soft">{HOME_ABILITIES.intro}</p>

          <div className="abilities__tabs" role="tablist" aria-label={HOME_ABILITIES.label} aria-orientation="vertical" onKeyDown={onKey}>
            {items.map((it, i) => (
              <button
                key={it.tab}
                id={`ability-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="ability-panel"
                tabIndex={i === active ? 0 : -1}
                className="abilities__tab"
                onClick={() => pick(i)}
              >
                <Bot glyph={it.glyph} className="abilities__tab-bot" />
                <span>{it.tab}</span>
              </button>
            ))}
          </div>
        </div>

        <div id="ability-panel" role="tabpanel" aria-labelledby={`ability-tab-${active}`} className="abilities__panel">
          <h3>{item.title}</h3>
          <p className="abilities__body">{item.body}</p>

          {/* keyed so each new pick plays its screen from the top */}
          <div key={active} className="abilities__screen">
            <p className="abilities__screen-title">
              <Bot glyph={item.glyph} className="abilities__screen-bot" />
              {item.screen.title}
            </p>
            <ul>
              {item.screen.lines.map((line, i) => (
                <li key={line.text} className="abilities__line" data-tone={line.tone} style={{ '--i': i } as React.CSSProperties}>
                  <span className="abilities__from">{line.from}</span>
                  <span className="abilities__text">
                    {line.text.split(YOU_TOKEN).flatMap((part, j) => (j ? [<mark key={j} className="abilities__you">{HOME_ABILITIES.you}</mark>, part] : [part]))}
                  </span>
                  {line.tone === 'ask' && <span className="abilities__yes" aria-hidden="true">{HOME_ABILITIES.yes}</span>}
                </li>
              ))}
            </ul>
          </div>

          <a className="abilities__go" href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}>
            {item.action} <span aria-hidden="true">{item.external ? '↗' : '→'}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
