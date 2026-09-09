import { useEffect, useState } from 'react'
import Underline from '../Underline'

/**
 * Hero of the Simple page — chapter 01 of one continuous page.
 *
 * The home hero's language: dotted grain and one warm bloom in the upper
 * right, behind the robot. The type stands bare on the cream — no plate, no
 * frame around it — label, heading and the supporting copy in one column.
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

      {/* ---------- the type: one column on the left ----------
          Label, heading and the supporting copy stand together on the left,
          bare on the cream (as on the home hero); the robot has the right.
          On phones the column is the top of the screen and the robot stands
          under it. No z-index on purpose: the robot (fixed, later in the
          DOM) renders in front where the two meet. */}
      {/* on desktop the column starts level with the robot's head: the robot
          box is centred at 50vh and min(76vh, 680px) tall, the head's top
          sits 0.29 of the box under its centre, and the label + its gap
          stand 36px above the heading's first line */}
      <div
        data-hero-copy
        className="pointer-events-none absolute left-[6%] top-[13%] max-w-[560px] max-sm:right-[5%] max-sm:max-w-none sm:top-[14%] lg:top-[calc(50svh_-_0.29*min(76svh,680px)_-_36px)] lg:max-w-[700px] xl:left-[8%] xl:max-w-[760px]"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Our Projects · Websites &amp; AI discoverability</div>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.7rem)] font-normal leading-[0.92] tracking-[-0.03em] text-ink">
          Your website, built
          <br />
          <span className="relative inline-block">
            <span className="relative z-10 italic font-normal text-brand-600">to a higher standard.</span>
            <Underline active={drawn} />
          </span>
        </h1>
        {/* ---------- supporting copy, under the heading ---------- */}
        <div className="mt-6 max-w-[520px] sm:mt-8">
          <p className="text-[15px] font-light leading-relaxed text-ink-soft sm:text-[16.5px]">
            A website is the front of a business. We build it with the same rigour we bring to the <em className="font-normal not-italic text-ink">operations behind one</em>.
          </p>
          <p className="mt-3 text-[14px] font-light leading-relaxed text-ink/60 sm:text-[15px]">
            Every page has a job. Fast for the people who visit, structured for the AI that recommends, and built to keep working long after launch.
          </p>
        </div>
      </div>
    </section>
  )
}
