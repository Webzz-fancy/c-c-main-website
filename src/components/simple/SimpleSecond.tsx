import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Eyebrow from '../Eyebrow'

type Props = {
  /** pre-pin scroll, 0 at the top of the page → 1 when the section's top reaches the top of the screen (the type comes in on it) */
  progress: number
  /** the cards' reveal: 0 as the row comes up into view → 1 when it stands in the middle of the screen */
  reveal: number
  /** the first card's destination: the projects window, opened */
  onProjects?: () => void
}

/**
 * Section 2 — what we do, in the language of the home page's approach
 * section: one glass box on the cream, the label, the heading and one
 * paragraph on top, and under them the two offers as glass cards with a
 * number each. The home page stacks its cards and runs the line down the
 * left; here the two cards stand side by side and the line runs along a
 * rail above them, from the left edge to the right, drawing itself with the
 * scroll — it lights the node above each card as it passes, and the cards
 * rise into place one after the other, the first a beat ahead of the
 * second, all of it standing by the time the row reaches the middle of the
 * screen. Scrolling back plays it back. On phones the cards stack and the
 * line is the same vertical rail as on the home page.
 */
export const AI_URL = 'https://ai.clauseandcode.com'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** the rail above the cards that the line runs along (px, md and up) */
const RAIL = 72
/** the node above a card sits over its number badge: the badge's centre from
 *  the card's left edge (the card's padding + half the badge) */
const NODE_X = { base: 24 + 22, sm: 28 + 22 }

type Offer = {
  number: string
  title: string
  body: string
  cta: string
  mark: string
  href: string
  external: boolean
}

const OFFERS: Offer[] = [
  {
    number: '01',
    title: 'Websites',
    body: 'We map who is visiting and what they came to do before a single page is designed. Then we build it fast, structured and easy to keep current.',
    cta: 'See the projects',
    mark: '→',
    href: '#projects',
    external: false,
  },
  {
    number: '02',
    title: 'AI discoverability & lead management',
    body: 'We put your business where people now look, in ChatGPT, Gemini and Instagram, and connect it all to your booking so every enquiry is answered.',
    cta: 'Explore the AI Client Engine',
    mark: '↗',
    href: AI_URL,
    external: true,
  },
]

export default function SimpleSecond({ progress, reveal, onProjects }: Props) {
  const c = clamp01(progress)
  const typeIn = outCubic(clamp01((c - 0.1) / 0.3))
  const r = clamp01(reveal)
  // the cards rise one after the other, the first a beat ahead of the
  // second; both stand before the row reaches the middle
  const cardIn = OFFERS.map((_, i) => outQuart(clamp01((r - i * 0.14) / 0.72)))

  // the line's geometry: the track's width and how far along the line each
  // card's node sits (a fraction of the line, so the nodes light in turn
  // as the draw passes them — along the rail on desktop, down the rail on
  // phones)
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [geom, setGeom] = useState<{ w: number; nodes: number[]; frac: number[] }>({ w: 0, nodes: [], frac: [] })

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const tb = track.getBoundingClientRect()
    const horizontal = window.innerWidth >= 768
    const nodeX = window.innerWidth >= 640 ? NODE_X.sm : NODE_X.base
    const items = itemRefs.current.filter((el): el is HTMLLIElement => !!el)
    const nodes: number[] = []
    const frac: number[] = []
    items.forEach((li) => {
      const b = li.getBoundingClientRect()
      const x = b.left - tb.left + nodeX
      nodes.push(x)
      if (horizontal) {
        frac.push(tb.width > 0 ? x / tb.width : 0)
      } else {
        // the phone rail runs from 24px below the track's top to 24px above
        // its bottom; each card's node sits 32px under the card's top
        const railH = Math.max(1, tb.height - 48)
        frac.push(clamp01((b.top - tb.top + 32 - 24) / railH))
      }
    })
    setGeom({ w: tb.width, nodes, frac })
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (trackRef.current) ro.observe(trackRef.current)
    window.addEventListener('resize', measure)
    // re-measure once webfonts settle, since they change the cards' heights
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const railY = RAIL / 2
  const reached = (i: number) => r >= (geom.frac[i] ?? i / Math.max(1, OFFERS.length - 1)) - 0.04

  return (
    <section id="simple-second" className="relative w-full bg-cream pb-16 pt-24 md:pb-20 md:pt-32">
      {/* ---------- ambient background behind the glass (as on the home page) ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 grain opacity-60" />
        <div
          className="absolute -left-32 top-24 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 70%)' }}
        />
        <div
          className="absolute -right-24 bottom-10 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(45,109,139,0.05) 0%, rgba(45,109,139,0) 70%)' }}
        />
        <div
          className="absolute left-1/3 top-1/2 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(45,109,139,0.05) 0%, rgba(45,109,139,0) 70%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        {/* ---------- the glass box ---------- */}
        <div
          className="relative isolate rounded-[28px] border border-white/70 px-5 py-12 shadow-[0_40px_100px_-40px_rgba(18,44,56,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[36px] sm:px-10 md:px-14 md:py-16"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.56) 0%, rgba(45,109,139,0.045) 45%, rgba(45,109,139,0.06) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          {/* specular highlight along the top edge */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[36px]" aria-hidden>
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 45%, transparent)' }}
            />
          </div>

          {/* ---------- the type: label · heading · one paragraph ---------- */}
          <div
            className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end lg:gap-16"
            style={{ opacity: typeIn, transform: `translateY(${((1 - typeIn) * 18).toFixed(1)}px)` }}
          >
            <div>
              <Eyebrow>What we do</Eyebrow>
              <h2 className="mt-6 font-display text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink">
                The website,
                <br />
                <span className="italic text-brand-600">and what brings people to it.</span>
              </h2>
            </div>
            <p className="max-w-md text-[clamp(0.98rem,1.15vw,1.08rem)] font-light leading-relaxed text-ink-soft lg:pb-2">
              We build the website itself, and the system around it that gets it recommended by search and AI and turns interest into enquiries. Same team, same standard as the operations we build.
            </p>
          </div>

          {/* ---------- the two cards, side by side, the line running above them from left to right ---------- */}
          <div ref={trackRef} data-cards className="relative mt-12 md:mt-14 md:pt-[72px]">
            {/* the line (md and up): a faint dashed track along the rail, the
                golden draw over it with the scroll, a node above each card */}
            {geom.w > 0 && (
              <svg
                className="pointer-events-none absolute left-0 top-0 z-0 hidden w-full md:block"
                style={{ height: RAIL }}
                viewBox={`0 0 ${geom.w} ${RAIL}`}
                fill="none"
                aria-hidden
              >
                <defs>
                  {/* the path is a flat line (a zero-height box), so the
                      gradient and the glow are set in user space — with box
                      units the browser would drop both */}
                  <linearGradient id="ccs-line-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={geom.w} y2="0">
                    <stop offset="0%" stopColor="#EBC96D" />
                    <stop offset="55%" stopColor="#E1AD34" />
                    <stop offset="100%" stopColor="#C9962A" />
                  </linearGradient>
                  <filter id="ccs-line-glow" filterUnits="userSpaceOnUse" x="-24" y="0" width={geom.w + 48} height={RAIL}>
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* the faint full length track */}
                <path
                  d={`M 0 ${railY} L ${geom.w} ${railY}`}
                  stroke="#1B1A17"
                  strokeOpacity="0.09"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 8"
                />

                {/* the draw: exactly as far as the scroll has taken it */}
                <path
                  d={`M 0 ${railY} L ${geom.w} ${railY}`}
                  stroke="url(#ccs-line-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#ccs-line-glow)"
                  style={{
                    strokeDasharray: geom.w,
                    strokeDashoffset: geom.w * (1 - r),
                    opacity: r > 0.002 ? 1 : 0,
                  }}
                />

                {/* the node above each card */}
                {geom.nodes.map((x, i) => {
                  const on = reached(i)
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={railY}
                        r={on ? 13 : 8}
                        fill="#E1AD34"
                        opacity={on ? 0.16 : 0}
                        style={{ transition: 'r 400ms ease, opacity 400ms ease' }}
                      />
                      <circle
                        cx={x}
                        cy={railY}
                        r="5"
                        fill={on ? '#E1AD34' : '#F8F5F0'}
                        stroke={on ? '#E1AD34' : 'rgba(27,26,23,0.18)'}
                        strokeWidth="2"
                        style={{ transition: 'fill 400ms ease, stroke 400ms ease' }}
                      />
                    </g>
                  )
                })}
              </svg>
            )}

            {/* phones: the vertical rail down the left, as on the home page */}
            <div className="pointer-events-none absolute bottom-6 left-[7px] top-6 w-px md:hidden" aria-hidden>
              <div className="h-full w-full bg-ink/10" />
              <div className="absolute inset-x-0 top-0 bg-brand" style={{ height: `${(r * 100).toFixed(1)}%` }} />
            </div>

            {/* the cards */}
            <ol className="relative z-10 grid grid-cols-1 gap-6 pl-6 md:grid-cols-2 md:gap-8 md:pl-0">
              {OFFERS.map((offer, i) => {
                const q = cardIn[i]
                const on = reached(i)
                const first = i === 0
                return (
                  <li
                    key={offer.number}
                    ref={(el) => {
                      itemRefs.current[i] = el
                    }}
                    className="relative"
                  >
                    {/* the node on the phone rail */}
                    <span
                      className={[
                        'absolute -left-[23px] top-8 h-[9px] w-[9px] rounded-full border-2 transition-colors duration-500 md:hidden',
                        on ? 'border-brand bg-brand' : 'border-black/15 bg-cream',
                      ].join(' ')}
                      aria-hidden
                    />

                    <a
                      href={offer.href}
                      target={offer.external ? '_blank' : undefined}
                      rel={offer.external ? 'noopener noreferrer' : undefined}
                      onClick={
                        first && onProjects
                          ? (e) => {
                              e.preventDefault()
                              onProjects()
                            }
                          : undefined
                      }
                      className={[
                        'group block h-full rounded-2xl border p-6 sm:p-7',
                        on
                          ? 'border-white/70 shadow-[0_24px_60px_-30px_rgba(18,44,56,0.4)]'
                          : 'border-white/40 shadow-[0_16px_40px_-30px_rgba(18,44,56,0.3)]',
                      ].join(' ')}
                      style={{
                        background: on
                          ? 'radial-gradient(150px 150px at 100% 0%, rgba(45,109,139,0.10) 0%, rgba(45,109,139,0) 72%), radial-gradient(150px 150px at 0% 100%, rgba(45,109,139,0.08) 0%, rgba(45,109,139,0) 72%), linear-gradient(145deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.50) 100%)'
                          : 'radial-gradient(150px 150px at 100% 0%, rgba(45,109,139,0.06) 0%, rgba(45,109,139,0) 72%), radial-gradient(150px 150px at 0% 100%, rgba(45,109,139,0.05) 0%, rgba(45,109,139,0) 72%), linear-gradient(145deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.32) 100%)',
                        backdropFilter: 'blur(16px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                        // the reveal, on the scroll: blur + lift out, settling into place
                        opacity: clamp01(q * 2).toFixed(3),
                        filter: q < 0.999 ? `blur(${((1 - q) * 14).toFixed(2)}px)` : 'none',
                        transform: `translate3d(0, ${((1 - q) * 34).toFixed(1)}px, 0) scale(${(0.97 + 0.03 * q).toFixed(4)})`,
                        transition: 'background 500ms ease, border-color 500ms ease, box-shadow 500ms ease',
                        willChange: 'opacity, transform, filter',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={[
                            'grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-[17px] transition-all duration-500',
                            on ? 'bg-brand text-ink shadow-brand' : 'bg-white/70 text-ink-muted ring-1 ring-inset ring-black/[0.06]',
                          ].join(' ')}
                        >
                          {offer.number}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-[clamp(1.3rem,1.9vw,1.65rem)] leading-tight tracking-[-0.01em] text-ink">{offer.title}</h3>
                          <p className="mt-2.5 text-[15px] font-light leading-relaxed text-ink-soft">{offer.body}</p>
                          <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                            <span className="relative">
                              {offer.cta}
                              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-brand transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:origin-left group-hover:scale-x-100" />
                            </span>
                            <span className="text-brand-600 transition-transform duration-300 group-hover:translate-x-1">{offer.mark}</span>
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
