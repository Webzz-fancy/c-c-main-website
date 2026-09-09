import { useEffect, useRef, useState } from 'react'

type Props = {
  /** pre-pin scroll, 0 at the top of the page → 1 when the section's top reaches the top of the screen */
  progress: number
  /** the flight: 0 when the cards come into view → 1 when the section has scrolled away */
  roll: number
  /** the first card's destination: the projects window, opened */
  onProjects?: () => void
}

/**
 * Section 2 — what Simple covers, as two cards (the Neutomni "Our Process"
 * row, in our blue on our cream).
 *
 * A short row of type on top: the small upper heading, the heading (set
 * like the hero's), a one line subheading. Under it two slim blue cards,
 * one per offer, as tall as their words, that rise into place one after the
 * other as the section scrolls in (translateY + blur, the reference's own
 * reveal). Each card is a link: Websites goes down to the projects window,
 * AI discoverability & lead management goes to ai.clauseandcode.com.
 *
 * Across both cards runs a dashed road, and the Clause & Code robot rides
 * its broom along it with the scroll, as a white line drawing (the brand's
 * own artwork, /broom-lineart.png) — from the first card to the second, so
 * the eye is carried from one offer to the next. Nothing here plays on a
 * timer; scrolling back flies it back.
 */
export const CARD_BLUE = '#2D6D8B'
export const AI_URL = 'https://ai.clauseandcode.com'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** the road's height inside a card, px from the card's top (the type
 *  starts under it) */
const ROAD_TOP = 168
/** how far out of focus a card starts (px), and how far below its place */
const RISE_BLUR = 12
const RISE_PX = 160

const CARDS = [
  {
    tag: 'Projects',
    mark: '↓',
    title: 'Websites',
    italic: 'built like products.',
    body: 'We map who is visiting and what they should do next, then build a site that answers that with nothing in the way. Quick to load, easy to keep current.',
    href: '#projects',
    external: false,
  },
  {
    tag: 'ai.clauseandcode.com',
    mark: '↗',
    title: 'AI discoverability',
    italic: '& lead management.',
    body: 'We structure your site so search engines and AI assistants recommend you, then capture the enquiries that follow and make sure each one is answered.',
    href: AI_URL,
    external: true,
  },
]

export default function SimpleSecond({ progress, roll, onProjects }: Props) {
  const c = clamp01(progress)
  // the row of type first, then the cards, one after the other
  const typeIn = outCubic(clamp01((c - 0.1) / 0.3))
  const cardIn = CARDS.map((_, i) => outQuart(clamp01((c - (0.26 + i * 0.13)) / 0.46)))

  // the rider: sized to the viewport (see the clamp below), its flight
  // spans the whole row of cards along the road
  const rowRef = useRef<HTMLDivElement>(null)
  const [dim, setDim] = useState({ rowW: 1200, vw: 1440 })
  useEffect(() => {
    const measure = () => setDim({ rowW: rowRef.current?.offsetWidth ?? 1200, vw: window.innerWidth })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const riderW = Math.round(Math.min(200, Math.max(104, dim.vw * 0.13)))
  const riderH = Math.round(riderW * 0.76)
  const travel = Math.max(0, dim.rowW - riderW)
  const q = clamp01(roll)
  // an eased flight: it sets off gently and settles at the far end
  const flight = q * q * (3 - 2 * q)
  const riderX = flight * travel
  // a slight bob along the way, and a lean into the flight
  const bob = Math.sin(q * Math.PI * 3) * 6
  const lean = -6 + Math.sin(q * Math.PI * 2) * 3
  const riderIn = cardIn[0]

  return (
    <section id="simple-second" className="relative overflow-hidden bg-cream px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:px-8 lg:pb-16 lg:pt-32">
      {/* the page's grain, as on the hero */}
      <div className="pointer-events-none absolute inset-0 grain opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-[1520px]">
        {/* ---------- the type: upper heading · heading · subheading ---------- */}
        <div className="max-w-[720px]" style={{ opacity: typeIn, transform: `translateY(${((1 - typeIn) * 18).toFixed(1)}px)` }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">What Simple covers</div>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
            Your website is
            <br />
            <span className="italic text-brand-600">a system too.</span>
          </h2>
          <p className="mt-5 text-[15px] font-light leading-relaxed text-ink-soft sm:text-[16px]">
            We offer two things, and we build both like one system: the website people visit, and the way people and AI find it.
          </p>
        </div>

        {/* ---------- the two cards ---------- */}
        <div ref={rowRef} className="relative mx-auto mt-8 grid w-full max-w-[560px] grid-cols-1 gap-[31px] sm:mt-10 lg:mt-12 lg:w-[60%] lg:max-w-none lg:grid-cols-2">
          {CARDS.map((card, i) => {
            const qi = cardIn[i]
            const first = i === 0
            return (
              <a
                key={card.title}
                href={card.href}
                target={card.external ? '_blank' : undefined}
                rel={card.external ? 'noopener noreferrer' : undefined}
                onClick={
                  first && onProjects
                    ? (e) => {
                        e.preventDefault()
                        onProjects()
                      }
                    : undefined
                }
                className="group relative block overflow-hidden text-white will-change-transform"
                style={{
                  backgroundColor: CARD_BLUE,
                  transform: `translate3d(0, ${((1 - qi) * RISE_PX).toFixed(1)}px, 0)`,
                  filter: qi < 0.999 ? `blur(${((1 - qi) * RISE_BLUR).toFixed(2)}px)` : 'none',
                  opacity: clamp01(qi * 3).toFixed(3),
                }}
              >
                {/* a little light in the upper left, so the plane is not dead flat */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%)' }}
                  aria-hidden
                />

                {/* the tag, top left: where the card goes */}
                <div className="absolute left-6 top-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/85 lg:left-8 lg:top-7">
                  <span className="relative inline-block">
                    [ {card.tag} {card.mark} ]
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-white/80 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:origin-left group-hover:scale-x-100" />
                  </span>
                </div>

                {/* the road: a dashed line across the card */}
                <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70" style={{ top: ROAD_TOP }} aria-hidden />

                {/* the type, under the road */}
                <div className="px-6 pb-7 lg:px-8 lg:pb-8" style={{ paddingTop: ROAD_TOP + 44 }}>
                  <h3 className="text-[clamp(1.6rem,2.1vw,2.2rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                    {card.title}
                    <br />
                    <span className="font-display font-normal italic">{card.italic}</span>
                  </h3>
                  <p className="mt-4 text-[14px] font-light leading-relaxed text-white/90 lg:text-[14.5px]">{card.body}</p>
                </div>
              </a>
            )
          })}

          {/* the rider — the robot on its broom, flying along the road with
              the scroll from the first card to the second */}
          <div
            className="pointer-events-none absolute left-0 will-change-transform"
            style={{
              top: ROAD_TOP,
              width: riderW,
              height: riderH,
              transform: `translate3d(${riderX.toFixed(1)}px, ${(-riderH * 0.7 + bob).toFixed(1)}px, 0) rotate(${lean.toFixed(2)}deg)`,
              opacity: riderIn.toFixed(3),
            }}
            aria-hidden
          >
            <img src="/broom-lineart.png" alt="" className="h-full w-full object-contain" draggable={false} decoding="async" />
          </div>
        </div>
      </div>
    </section>
  )
}
