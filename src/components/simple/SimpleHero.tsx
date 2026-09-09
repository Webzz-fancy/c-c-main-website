import { useEffect, useState } from 'react'
import Underline from '../Underline'

/**
 * Hero of the Simple page — chapter 01 of one continuous page.
 *
 * The home hero's language: dotted grain and one warm bloom in the upper
 * right, behind the robot. The heading stands bare on the cream and the
 * supporting copy sits on a glass plate under it, the whole column inside
 * the page's container (the same 1240px frame section 2 uses), so the type
 * lines up with the glass box below it.
 *
 * The type stands in one column on the left; the robot has the right. The
 * hero ends on a straight edge and section 2 simply begins on the same
 * cream — the dotted trail carries the eye across.
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
      {/* ---------- ambient: the warm corner behind the robot (as on the home hero) ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 grain opacity-70" />
        <div
          className="absolute -right-40 -top-32 h-[640px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.16) 0%, rgba(225,173,52,0) 68%)' }}
        />
        {/* a long diagonal wash of the same warmth, so the corner reads as a shaft of light, not a spot */}
        <div
          className="absolute -right-[10%] top-[-20%] h-[150%] w-[46%] rotate-[18deg] blur-3xl"
          style={{ background: 'linear-gradient(180deg, rgba(225,173,52,0.10) 0%, rgba(225,173,52,0.04) 55%, rgba(225,173,52,0) 100%)' }}
        />
      </div>

      {/* ---------- the type: one column on the left, inside the container ----------
          Label, heading and the supporting copy stand together on the left
          (heading bare on the cream, the copy on glass, as on the home
          hero); the robot has the right. On phones the column is the top of
          the screen and the robot stands under it. No z-index on purpose:
          the robot (fixed, later in the DOM) renders in front where the two
          meet. */}
      <div className="pointer-events-none absolute inset-x-0 top-[13%] sm:top-[14%]">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <div data-hero-copy className="max-w-[560px] lg:max-w-[600px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Our Projects · Websites &amp; AI discoverability</div>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
              Websites, built
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 italic font-normal text-brand-600">like systems.</span>
                <Underline active={drawn} />
              </span>
            </h1>
            {/* ---------- supporting copy on glass, under the heading ---------- */}
            <div className="mt-7 max-w-[440px] sm:mt-9">
              <div
                className="relative rounded-[22px] border border-white/60 px-5 py-4 shadow-[0_26px_70px_-34px_rgba(18,44,56,0.42),inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-7 sm:py-6"
                style={{
                  background: 'linear-gradient(150deg, rgba(255,255,255,0.62) 0%, rgba(45,109,139,0.045) 55%, rgba(45,109,139,0.06) 100%)',
                  backdropFilter: 'blur(22px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(170%)',
                }}
              >
                <p className="text-[13.5px] font-light leading-relaxed text-ink-soft sm:text-[14.5px]">
                  A website is the front of a business. We build it with the same rigour we bring to the <em className="font-normal not-italic text-ink">operations behind one</em>.
                </p>
                <p className="mt-2 text-[13px] font-light leading-relaxed text-ink/60 sm:text-[13.8px]">
                  Every page has a job. Fast for the people who visit, structured for the AI that recommends, and built to keep working long after launch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
