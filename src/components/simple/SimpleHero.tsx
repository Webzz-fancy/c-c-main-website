import { useEffect, useState } from 'react'
import Underline from '../Underline'

/**
 * Hero of the Simple page — chapter 01 of one continuous page.
 *
 * The home hero's glass language, one to one: dotted grain, the warm bloom on
 * the upper right and the cool bloom on the lower left (opposite diagonals),
 * the heading bare on the cream and a glass plate under the supporting copy.
 *
 * The type stands in one column on the left; the robot has the right. The
 * hero ends on a straight edge and section 2 simply begins on the same
 * cream — no divider shape between the two, the arrow carries the eye
 * across.
 */
type Props = {
  /** true once the loading screen has cleared: the underline draws after that */
  revealed: boolean
}

export default function SimpleHero({ revealed }: Props) {
  // as on the home hero: the heading is already standing there when the page
  // is revealed, and the underline draws itself a beat later
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    if (!revealed) return
    const t = window.setTimeout(() => setDrawn(true), 160)
    return () => window.clearTimeout(t)
  }, [revealed])

  return (
    <section id="simple-hero" className="relative flex h-[100svh] min-h-[640px] w-full flex-col overflow-hidden bg-cream">
      {/* ---------- ambient: warm / cool opposite diagonals (as on the home hero) ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 grain opacity-70" />
        {/* orange corner, top right, behind the robot */}
        <div
          className="absolute -right-40 -top-32 h-[640px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.16) 0%, rgba(225,173,52,0) 68%)' }}
        />
        {/* a long diagonal wash of the same warmth, so the corner reads as a shaft of light, not a spot */}
        <div
          className="absolute -right-[10%] top-[-20%] h-[150%] w-[46%] rotate-[18deg] blur-3xl"
          style={{ background: 'linear-gradient(180deg, rgba(225,173,52,0.10) 0%, rgba(225,173,52,0.04) 55%, rgba(225,173,52,0) 100%)' }}
        />
        {/* blue corner, bottom left — it leans into the blue cards that follow */}
        <div
          className="absolute -bottom-36 -left-40 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.12) 0%, rgba(45,109,139,0) 68%)' }}
        />
        <div
          className="absolute -left-[10%] bottom-[-20%] h-[150%] w-[46%] rotate-[18deg] blur-3xl"
          style={{ background: 'linear-gradient(0deg, rgba(45,109,139,0.09) 0%, rgba(45,109,139,0.035) 55%, rgba(45,109,139,0) 100%)' }}
        />
      </div>

      {/* ---------- the type: one column on the left ----------
          Subheading, heading and the supporting copy stand together on the
          left (heading bare on the cream, the copy on glass, as on the home
          hero); the robot has the right. On phones the column is the top of
          the screen and the robot stands under it. No z-index on purpose:
          the robot (fixed, later in the DOM) renders in front where the two
          meet. */}
      <div
        data-hero-copy
        className="pointer-events-none absolute left-[6%] top-[13%] max-w-[560px] max-sm:right-[5%] max-sm:max-w-none sm:top-[14%] lg:max-w-[600px] xl:left-[8%]"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Our Projects · Simple</div>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
          Simple on the
          <br />
          <span className="relative inline-block">
            <span className="relative z-10 italic font-normal text-brand-600">outside.</span>
            <Underline active={drawn} />
          </span>
        </h1>
        {/* ---------- supporting copy on glass, under the heading ---------- */}
        <div className="mt-7 max-w-[420px] sm:mt-9">
          <div
            className="relative rounded-[22px] border border-white/60 px-5 py-4 shadow-[0_26px_70px_-34px_rgba(18,44,56,0.42),inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-7 sm:py-6"
            style={{
              background: 'linear-gradient(150deg, rgba(255,255,255,0.62) 0%, rgba(45,109,139,0.045) 55%, rgba(45,109,139,0.06) 100%)',
              backdropFilter: 'blur(22px) saturate(170%)',
              WebkitBackdropFilter: 'blur(22px) saturate(170%)',
            }}
          >
            <p className="text-[13.5px] font-light leading-relaxed text-ink-soft sm:text-[14.5px]">
              Websites and AI discoverability, built with the same discipline we bring to <em className="font-normal not-italic text-ink">backend systems</em>.
            </p>
            <p className="mt-2 text-[13px] font-light leading-relaxed text-ink/60 sm:text-[13.8px]">
              Clear for the people who visit. Readable for the AI that recommends. Structured underneath so it keeps working as you grow.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
