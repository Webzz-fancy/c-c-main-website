import { useEffect, useRef, useState } from 'react'

type Props = {
  /** pre-pin scroll, 0 at the top of the page → 1 when the section's top reaches the top of the screen */
  progress: number
  /** the wheel's road: 0 when the section's top is mid-screen → 1 when the section has scrolled away */
  roll: number
  /** the first card's destination: the projects window, opened */
  onProjects?: () => void
}

/**
 * Section 2 — what Simple covers, as two cards (the Neutomni "Our Process"
 * row, in our blue on our cream).
 *
 * A short row of type on top: the subheading, one statement, a pill. Under
 * it two tall blue cards, one per offer, that rise into place one after the
 * other as the section scrolls in (translateY + blur, the reference's own
 * reveal). Each card is a link: Websites goes down to the projects window,
 * AI discoverability & lead management goes to ai.clauseandcode.com.
 *
 * Across both cards runs a dashed road, and a wheel rolls along it with the
 * scroll (the reference's "the road can get bumpy" wheel) — from the first
 * card to the second, so the eye is carried from one offer to the next.
 * Nothing here plays on a timer; scrolling back rolls it back.
 */
export const CARD_BLUE = '#2D6D8B'
export const AI_URL = 'https://ai.clauseandcode.com'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** the road's height inside a card (fraction of the card) */
const ROAD_Y = 0.42
/** how far out of focus a card starts (px), and how far below its place */
const RISE_BLUR = 12
const RISE_PX = 160

const CARDS = [
  {
    tag: 'Projects',
    mark: '↓',
    title: 'Websites',
    italic: 'built like products.',
    body: 'Mapped before they are designed, quick to load, and easy for your team to keep current. See the recent builds below.',
    href: '#projects',
    external: false,
  },
  {
    tag: 'ai.clauseandcode.com',
    mark: '↗',
    title: 'AI discoverability',
    italic: '& lead management.',
    body: 'Structured so search engines and AI assistants recommend you, and the leads that follow are captured and answered.',
    href: AI_URL,
    external: true,
  },
]

/** a slightly uneven circle (so its turning can be seen), as a path */
function wheelPath(r: number) {
  const n = 28
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 + 0.035 * Math.sin(a * 3 + 0.6) + 0.02 * Math.cos(a * 5))
    pts.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

/** the bumpy ground the wheel rolls on: a low wave across the card */
const GROUND_D = (() => {
  const seg: string[] = ['M 0 6']
  for (let x = 0; x <= 1200; x += 30) {
    const y = 6 + 3.2 * Math.sin(x / 38) + 1.4 * Math.sin(x / 11 + 1)
    seg.push(`L ${x} ${y.toFixed(2)}`)
  }
  return seg.join(' ')
})()

export default function SimpleSecond({ progress, roll, onProjects }: Props) {
  const c = clamp01(progress)
  // the row of type first, then the cards, one after the other
  const typeIn = outCubic(clamp01((c - 0.1) / 0.3))
  const cardIn = CARDS.map((_, i) => outQuart(clamp01((c - (0.26 + i * 0.13)) / 0.46)))

  // the wheel: its size follows the viewport (one CSS clamp, mirrored here
  // for the rolling angle), its travel spans the whole row of cards
  const rowRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [dim, setDim] = useState({ rowW: 1200, cardH: 560, vw: 1440 })
  useEffect(() => {
    const measure = () =>
      setDim({
        rowW: rowRef.current?.offsetWidth ?? 1200,
        cardH: cardRef.current?.offsetHeight ?? 560,
        vw: window.innerWidth,
      })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const r = Math.round(Math.min(92, Math.max(48, dim.vw * 0.064)))
  // the road runs across the whole row: both cards side by side on desktop,
  // the first card alone where the cards stack
  const travel = Math.max(0, dim.rowW - 2 * r - 8)
  const rollQ = clamp01(roll)
  const wheelX = r + 4 + rollQ * travel
  const wheelDeg = ((rollQ * travel) / r) * (180 / Math.PI)
  const wheelIn = cardIn[0]

  return (
    <section id="simple-second" className="relative overflow-hidden bg-cream px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:px-8 lg:pb-16 lg:pt-32">
      {/* the page's grain, as on the hero */}
      <div className="pointer-events-none absolute inset-0 grain opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-[1520px]">
        {/* ---------- the row of type: subheading · statement · pill ---------- */}
        <div
          className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_minmax(0,1.15fr)_auto] lg:gap-10"
          style={{ opacity: typeIn, transform: `translateY(${((1 - typeIn) * 18).toFixed(1)}px)` }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">What Simple covers</div>
          <p className="max-w-[380px] text-[17px] font-light leading-snug text-glass-500 sm:col-span-2 lg:col-span-1 lg:text-[19px]">
            Your website is a <em className="font-display not-italic italic text-[1.12em] leading-none">system</em> too.
            <br className="hidden sm:block" /> We build it like <em className="font-display italic text-[1.12em] leading-none">one</em>.
          </p>
          <div className="hidden sm:block">
            <span className="inline-flex items-center rounded-full border border-glass-500 px-6 py-2.5 font-display text-[22px] italic leading-none text-glass-500">
              Two offers
            </span>
          </div>
        </div>

        {/* ---------- the two cards ---------- */}
        <div ref={rowRef} className="relative mt-8 grid grid-cols-1 gap-3 sm:mt-10 lg:mt-12 lg:grid-cols-2 lg:gap-4">
          {CARDS.map((card, i) => {
            const q = cardIn[i]
            const first = i === 0
            return (
              <a
                key={card.title}
                ref={first ? cardRef : undefined}
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
                className="group relative block h-[clamp(420px,62svh,560px)] overflow-hidden text-white will-change-transform lg:h-[clamp(460px,64svh,620px)]"
                style={{
                  backgroundColor: CARD_BLUE,
                  transform: `translate3d(0, ${((1 - q) * RISE_PX).toFixed(1)}px, 0)`,
                  filter: q < 0.999 ? `blur(${((1 - q) * RISE_BLUR).toFixed(2)}px)` : 'none',
                  opacity: clamp01(q * 3).toFixed(3),
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

                {/* the road: a dashed line across the card, and the bumpy ground under it */}
                <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70" style={{ top: `${ROAD_Y * 100}%` }} aria-hidden />
                <svg
                  className="pointer-events-none absolute inset-x-0 h-[12px] w-full"
                  style={{ top: `calc(${ROAD_Y * 100}% + ${r}px - 6px)` }}
                  viewBox="0 0 1200 12"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d={GROUND_D} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* the type, at the bottom */}
                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                  <h2 className="text-[clamp(1.9rem,3.1vw,3rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                    {card.title}
                    <br />
                    <span className="font-display font-normal italic">{card.italic}</span>
                  </h2>
                  <p className="mt-4 max-w-[440px] text-[14.5px] font-light leading-relaxed text-white/90 lg:text-[15.5px]">{card.body}</p>
                </div>
              </a>
            )
          })}

          {/* the wheel — rolling along the road with the scroll, so it turns
              exactly as far as it travels */}
          {
            <div
              className="pointer-events-none absolute left-0 will-change-transform"
              style={{
                top: Math.round(ROAD_Y * dim.cardH),
                transform: `translate3d(${wheelX.toFixed(1)}px, 0, 0)`,
                opacity: wheelIn.toFixed(3),
              }}
              aria-hidden
            >
              <svg
                width={r * 2 + 8}
                height={r * 2 + 8}
                viewBox={`${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}`}
                className="absolute"
                style={{ left: -r - 4, top: -r - 4, transform: `rotate(${wheelDeg.toFixed(2)}deg)` }}
              >
                <path d={wheelPath(r)} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="1.2" />
                <circle r="2.6" fill="#FFFFFF" />
                <path d={`M 0 0 L 0 ${(-r * 0.92).toFixed(1)}`} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              </svg>
            </div>
          }
        </div>
      </div>
    </section>
  )
}
