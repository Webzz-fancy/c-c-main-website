import { useEffect, useState } from 'react'
import Underline from '../Underline'

/**
 * Hero of the Simple page — chapter 01 of one continuous page.
 *
 * The home hero's glass language, one to one: dotted grain, the warm bloom on
 * the upper right and the cool bloom on the lower left (opposite diagonals),
 * the heading bare on the cream and a glass plate under the supporting copy.
 *
 * The page is held together by ONE line. It starts here as the short rule
 * under the heading, becomes the chapter rules of section 2, and ends as the
 * clothesline the projects hang from in section 3. So the hero ends on a
 * straight edge: the blue plane of section 2 simply begins — no divider
 * shape between the two, the robot and the arrow carry the eye across.
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
        {/* blue corner, bottom left — it leans into the blue plane that follows */}
        <div
          className="absolute -bottom-36 -left-40 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.12) 0%, rgba(45,109,139,0) 68%)' }}
        />
        <div
          className="absolute -left-[10%] bottom-[-20%] h-[150%] w-[46%] rotate-[18deg] blur-3xl"
          style={{ background: 'linear-gradient(0deg, rgba(45,109,139,0.09) 0%, rgba(45,109,139,0.035) 55%, rgba(45,109,139,0) 100%)' }}
        />
      </div>

      {/* ---------- heading, upper left (bare, as on the home hero) ----------
          No z-index on purpose: the robot (in the pinned stage, later in the
          DOM) renders in front of the text where the two meet. From lg up
          the block is nudged left of the home hero's text column so the
          robot's head clears it on every desktop width down to 1024. */}
      <div className="pointer-events-none absolute left-[6%] top-[13%] max-w-[560px] max-sm:right-[5%] max-sm:max-w-none sm:top-[14%] lg:left-[6%] lg:max-w-[600px] xl:left-[8%]">
        {/* chapter index — the same mark opens each of the three sections */}
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
          <span className="tabular-nums text-ink/75">01</span>
          <span className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" aria-hidden />
          Our Projects · Simple
        </div>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
          Simple on the
          <br />
          <span className="relative inline-block">
            <span className="relative z-10 italic font-normal text-brand-600">outside.</span>
            <Underline active={drawn} />
          </span>
        </h1>
        {/* the seed of the line that runs through the page */}
        <div className="mt-5 h-px w-12 bg-ink/20" />
      </div>

      {/* ---------- supporting copy on glass, lower right ---------- */}
      <div className="pointer-events-none absolute bottom-[12%] right-[5%] z-10 max-w-[380px] max-sm:left-[5%] max-sm:max-w-none sm:bottom-[13%] lg:bottom-[14%] lg:right-[7%] lg:max-w-[420px]">
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
    </section>
  )
}
