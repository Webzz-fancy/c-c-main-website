import Underline from '../Underline'
import ChapterRule from './ChapterRule'

type Props = {
  /** pre-pin scroll, 0 at the top of the page → 1 when the section is fully in view */
  progress: number
  /**
   * The section's exit, 0→1 (the first part of the pinned entrance of
   * section 3): the type leaves before the ground changes tone, so white
   * copy is never seen on the wrong colour.
   */
  leave?: number
}

/**
 * Section 2 — chapter 02, a flat plane of the faded brand blue.
 *
 * The line that runs through the page arrives here as the chapter rule: it
 * draws itself across the full width as the section comes into view, and
 * the copy staggers in under it on the same clock. The heading stands bare
 * on the blue (as the hero heading stands bare on the cream); only the two
 * offers sit on glass. The robot perches in the empty right column.
 */
export const SECOND_BG = '#4D7D94'

const CARD_BG = 'linear-gradient(150deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export default function SimpleSecond({ progress, leave = 0 }: Props) {
  const c = clamp01(progress)
  // the reveals ride the same pre-pin scroll as the arrow, so they read as
  // one thing: the rule first, then the heading, the copy, the offers
  const in0 = outCubic(clamp01((c - 0.1) / 0.26))
  const in1 = clamp01((c - 0.16) / 0.2)
  const in2 = clamp01((c - 0.22) / 0.2)
  const in3 = clamp01((c - 0.28) / 0.2)
  // the exit: everything lifts a little and fades, together
  const out = smooth(clamp01(leave))

  return (
    <section
      id="simple-second"
      className="relative overflow-hidden px-6 pb-16 pt-28 sm:pb-20 sm:pt-32 lg:min-h-[92vh] lg:pb-24 lg:pt-36"
      style={{ backgroundColor: SECOND_BG }}
    >
      {/* ---------- ambient: grain + light, quiet, so the plane stays flat ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* cool light, upper left, over the heading */}
        <div
          className="absolute -left-40 -top-24 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 68%)' }}
        />
        {/* warm light, lower right, under the robot: the hero's orange, carried through */}
        <div
          className="absolute -bottom-32 -right-32 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.12) 0%, rgba(225,173,52,0) 68%)' }}
        />
        {/* a deeper pool of the base blue, top right, for depth behind the robot */}
        <div
          className="absolute -right-20 top-[8%] h-[520px] w-[620px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.30) 0%, rgba(45,109,139,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px]">
        {/* ---------- the chapter rule: index · the line · label ----------
            It fades where it stands (no lift): chapter 03's rule draws in
            exactly this place once the ground has changed tone. */}
        <div style={{ opacity: 1 - out }}>
          <ChapterRule index="02" label="What Simple covers" drawn={in0} tone="light" />
        </div>

        <div
          className="mt-10 grid grid-cols-1 gap-10 sm:mt-12 lg:mt-14 lg:grid-cols-[1.02fr_0.92fr] lg:items-start"
          style={{
            opacity: 1 - out,
            transform: `translateY(${(-26 * out).toFixed(1)}px)`,
          }}
        >
          <div className="max-w-[640px]">
            {/* ---------- the heading, bare on the blue ---------- */}
            <h2
              className="font-display text-[clamp(2.1rem,4vw,3.4rem)] font-normal leading-[1.0] tracking-[-0.025em] text-white"
              style={{ opacity: in1, transform: `translateY(${(1 - in1) * 14}px)`, transition: 'opacity 560ms ease, transform 760ms cubic-bezier(0.16,1,0.3,1)' }}
            >
              Your website is{' '}
              <span className="relative inline-block">
                <span className="relative z-10 italic">a system too.</span>
                {/* the home page's hand drawn line: it draws once the heading has
                    settled and undraws if the visitor scrolls back up */}
                <Underline active={in1 > 0.6} delay={260} duration={1500} opacity={0.85} />
              </span>
              <br />
              <span className="text-white/80">We build it like one.</span>
            </h2>

            <p
              className="mt-6 max-w-[560px] text-[14.5px] font-light leading-relaxed text-white/90 sm:text-[15px]"
              style={{ opacity: in2, transform: `translateY(${(1 - in2) * 12}px)`, transition: 'opacity 560ms ease 80ms, transform 760ms cubic-bezier(0.16,1,0.3,1) 80ms' }}
            >
              Every Simple build starts with the same process mapping we use for operations work: who is visiting, what they need to understand, and what they should do next. Then we design and build a site that answers those three questions with nothing in the way.
            </p>
            <p
              className="mt-3 max-w-[560px] text-[13.8px] font-light leading-relaxed text-white/75 sm:text-[14.2px]"
              style={{ opacity: in2, transform: `translateY(${(1 - in2) * 12}px)`, transition: 'opacity 560ms ease 140ms, transform 760ms cubic-bezier(0.16,1,0.3,1) 140ms' }}
            >
              The result is fast, clearly structured, and easy for both people and AI search to read. Simple to use, because the thinking underneath is not.
            </p>

            {/* ---------- the two offers, on glass ---------- */}
            <div
              className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2"
              style={{ opacity: in3, transform: `translateY(${(1 - in3) * 12}px)`, transition: 'opacity 560ms ease 200ms, transform 740ms cubic-bezier(0.16,1,0.3,1) 200ms' }}
            >
              <div
                className="relative rounded-[18px] border border-white/[0.16] p-5 shadow-[0_30px_80px_-40px_rgba(10,30,40,0.55),inset_0_1px_0_rgba(255,255,255,0.28)]"
                style={{ background: CARD_BG, backdropFilter: 'blur(12px) saturate(140%)', WebkitBackdropFilter: 'blur(12px) saturate(140%)' }}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Websites</div>
                <div className="mt-2 text-[14.5px] font-medium leading-snug text-white">Built like a product, not a brochure.</div>
                <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/80">Clear structure, quick to load, and easy for your team to update, so the site keeps working as the business grows.</div>
              </div>
              <div
                className="relative rounded-[18px] border border-white/[0.16] p-5 shadow-[0_30px_80px_-40px_rgba(10,30,40,0.55),inset_0_1px_0_rgba(255,255,255,0.28)]"
                style={{ background: CARD_BG, backdropFilter: 'blur(12px) saturate(140%)', WebkitBackdropFilter: 'blur(12px) saturate(140%)' }}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-[#C2D9E5]" /> AI Discoverability</div>
                <div className="mt-2 text-[14.5px] font-medium leading-snug text-white">Found by people and by AI.</div>
                <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/80">Structured data, clean semantics and plain answers, so search engines and AI assistants recommend you when it counts.</div>
              </div>
            </div>
          </div>

          {/* the empty right column: the robot's perch */}
          <div className="hidden lg:block" aria-hidden>
            <div className="h-[360px]" />
          </div>
        </div>
      </div>
    </section>
  )
}
