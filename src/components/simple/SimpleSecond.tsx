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
 * number each, side by side (stacked on phones). The cards rise into place
 * one after the other, the first a beat ahead of the second, and light as
 * they settle, all of it standing by the time the row reaches the middle of
 * the screen. Scrolling back plays it back.
 */
export const AI_URL = 'https://ai.clauseandcode.com'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)

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
    cta: 'Explore AI discoverability',
    mark: '↗',
    href: AI_URL,
    external: true,
  },
]

export default function SimpleSecond({ progress, reveal, onProjects }: Props) {
  const c = clamp01(progress)
  const soft = typeof window === 'undefined' || window.innerWidth >= 1024
  const typeIn = outCubic(clamp01((c - 0.1) / 0.3))
  const r = clamp01(reveal)
  // the cards rise one after the other, the first a beat ahead of the
  // second; both stand before the row reaches the middle
  const cardIn = OFFERS.map((_, i) => outQuart(clamp01((r - i * 0.14) / 0.72)))

  // a card lights once it has all but settled into place
  const reached = (i: number) => cardIn[i] >= 0.96

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

          {/* ---------- the two cards, side by side ---------- */}
          <div data-cards className="relative mt-12 md:mt-14">
            {/* the cards */}
            <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              {OFFERS.map((offer, i) => {
                const q = cardIn[i]
                const on = reached(i)
                const first = i === 0
                return (
                  <li key={offer.number} className="relative">
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
                        // (the blur part of the reveal is desktop only: a
                        // per-frame blur on a glass card is what makes a
                        // phone stick on the way down to the projects)
                        filter: soft && q < 0.999 ? `blur(${((1 - q) * 14).toFixed(2)}px)` : 'none',
                        transform: `translate3d(0, ${((1 - q) * 34).toFixed(1)}px, 0) scale(${(0.97 + 0.03 * q).toFixed(4)})`,
                        transition: 'background 500ms ease, border-color 500ms ease, box-shadow 500ms ease',
                        willChange: 'opacity, transform, filter',
                      }}
                    >
                      <div className="flex h-full items-start gap-4">
                        <span
                          className={[
                            'grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-[17px] transition-all duration-500',
                            on ? 'bg-brand text-ink shadow-brand' : 'bg-white/70 text-ink-muted ring-1 ring-inset ring-black/[0.06]',
                          ].join(' ')}
                        >
                          {offer.number}
                        </span>

                        {/* a column the height of the card, so the link sits on the
                            bottom of both cards and the bodies start level
                            (the title holds two lines on desktop even when
                            it needs one) */}
                        <div className="flex h-full min-w-0 flex-1 flex-col">
                          <h3 className="font-display md:min-h-[2.5em] text-[clamp(1.3rem,1.9vw,1.65rem)] leading-tight tracking-[-0.01em] text-ink">{offer.title}</h3>
                          <p className="mb-5 mt-2.5 text-[15px] font-light leading-relaxed text-ink-soft">{offer.body}</p>
                          <span className="mt-auto inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
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
