import { SECOND_BG } from './SimpleSecond'

/**
 * Hero of the Simple page — the home hero's glass language, one to one:
 * dotted grain, the warm bloom on the upper right and the cool bloom on the
 * lower left (opposite diagonals), a glass plate under the heading and a
 * glass plate under the supporting copy, both with the specular top edge.
 */
export default function SimpleHero() {
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
        {/* blue corner, bottom left */}
        <div
          className="absolute -bottom-36 -left-40 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.12) 0%, rgba(45,109,139,0) 68%)' }}
        />
        <div
          className="absolute -left-[10%] bottom-[-20%] h-[150%] w-[46%] rotate-[18deg] blur-3xl"
          style={{ background: 'linear-gradient(0deg, rgba(45,109,139,0.09) 0%, rgba(45,109,139,0.035) 55%, rgba(45,109,139,0) 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.07] to-transparent" />
      </div>

      {/* ---------- heading on glass, upper left ----------
          No z-index on purpose: the robot (in the pinned stage, later in the
          DOM) renders in front of this plate, so where the two meet the robot
          stands before the glass, never behind a frosted corner. From lg up
          the plate hugs its text (w-fit) and is nudged left of the home
          hero's text column, so the robot's head clears it on every desktop
          width down to 1024. */}
      <div className="pointer-events-none absolute left-[5%] top-[11%] max-w-[560px] max-sm:right-[5%] max-sm:max-w-none sm:top-[12%] lg:left-[4%] lg:top-[13%] lg:max-w-[600px] xl:left-[6%]">
        <div
          className="relative isolate rounded-[26px] border border-white/70 px-6 py-6 shadow-[0_40px_100px_-40px_rgba(18,44,56,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] sm:rounded-[30px] sm:px-7 sm:py-7 lg:w-fit lg:pr-9"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.56) 0%, rgba(45,109,139,0.045) 45%, rgba(45,109,139,0.06) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px] sm:rounded-[30px]" aria-hidden>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 45%, transparent)' }} />
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
            <span className="flex items-center gap-2" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="h-px w-7 bg-gradient-to-r from-brand/70 to-transparent" />
            </span>
            Our Projects · Simple
          </div>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
            Simple on the
            <br />
            <span className="italic font-normal text-brand-600">outside.</span>
          </h1>
        </div>
      </div>

      {/* ---------- supporting copy on glass, lower right ---------- */}
      <div className="pointer-events-none absolute bottom-[13%] right-[5%] z-10 max-w-[380px] max-sm:left-[5%] max-sm:max-w-none sm:bottom-[15%] lg:bottom-[16%] lg:right-[7%] lg:max-w-[420px]">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="block h-[96px] w-full sm:h-[122px] lg:h-[146px]" style={{ color: SECOND_BG }}>
          <path d="M0 120 C 180 92, 320 42, 520 86 C 680 118, 840 158, 1040 96 C 1180 48, 1320 36, 1440 78 L 1440 220 L 0 220 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
