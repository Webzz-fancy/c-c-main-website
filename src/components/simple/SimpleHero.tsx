export default function SimpleHero() {
  return (
    <section id="simple-hero" className="relative flex h-[100svh] min-h-[640px] w-full flex-col overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 grain opacity-[0.5]" />
        <div className="absolute -right-40 -top-36 h-[620px] w-[720px] rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.08) 0%, rgba(225,173,52,0) 68%)' }} />
        <div className="absolute -bottom-40 -left-40 h-[560px] w-[700px] rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.07) 0%, rgba(45,109,139,0) 68%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
      </div>

      {/* Heading — upper left of robot, intentionally off-center */}
      <div className="pointer-events-none absolute left-[6%] top-[13%] z-10 max-w-[520px] lg:left-[8%] lg:top-[14%] lg:max-w-[560px]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/35">01 — Simple</div>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.7rem)] font-normal leading-[0.9] tracking-[-0.03em] text-ink">
          We call it
          <br />
          <span className="italic font-normal text-ink">Simple.</span>
        </h1>
        <div className="mt-3 h-px w-12 bg-ink/15" />
      </div>

      {/* Supporting text — lower right of robot, slightly offset, human tone */}
      <div className="pointer-events-none absolute bottom-[17%] right-[6%] z-10 max-w-[360px] lg:bottom-[18%] lg:right-[8%] lg:max-w-[400px]">
        <p className="text-[14.5px] font-light leading-relaxed text-ink-soft">
          Not because it’s basic. Because it <em className="font-normal not-italic text-ink">feels</em> that way when it’s done right.
        </p>
        <p className="mt-2 text-[13.8px] font-light leading-relaxed text-ink/60">
          Websites and discoverability — the two places where clarity quietly decides if you’re chosen, by people and by AI.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="block h-[96px] w-full text-[#08080A] sm:h-[122px] lg:h-[146px]">
          <path d="M0 120 C 180 92, 320 42, 520 86 C 680 118, 840 158, 1040 96 C 1180 48, 1320 36, 1440 78 L 1440 220 L 0 220 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
