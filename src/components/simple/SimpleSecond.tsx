type Props = { progress: number }

export default function SimpleSecond({ progress }: Props) {
  const c = Math.max(0, Math.min(1, progress))
  // content comes in as arrow moves — tied to same progress so it feels like
  // one thing. The footer lengthened the page, so the windows run a touch
  // earlier to finish while the section is centred in the viewport.
  const in1 = Math.max(0, Math.min(1, (c - 0.16) / 0.2))
  const in2 = Math.max(0, Math.min(1, (c - 0.22) / 0.2))
  const in3 = Math.max(0, Math.min(1, (c - 0.28) / 0.2))

  return (
    <section id="simple-second" className="relative overflow-hidden bg-[#08080A] px-6 py-16 sm:py-20 lg:min-h-[92vh] lg:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-[1.02fr_0.92fr] lg:items-center">
        <div
          className="max-w-[600px]"
          style={{ opacity: in1, transform: `translateY(${(1 - in1) * 14}px)`, transition: 'opacity 520ms ease, transform 720ms cubic-bezier(0.16,1,0.3,1)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Simple — in practice</div>
          <h2 className="mt-4 font-display text-[clamp(1.65rem,3.2vw,2.6rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white" style={{ opacity: in1, transform: `translateY(${(1 - in1) * 10}px)`, transition: 'opacity 560ms ease 60ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 60ms' }}>
            Made to feel light.
            <br />
            <span className="text-white/85">Built with everything underneath.</span>
          </h2>
          <p className="mt-4 max-w-[540px] text-[14.5px] font-light leading-relaxed text-white/70" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 120ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 120ms' }}>
            The work people call <span className="text-white">“simple”</span> is usually where projects lose momentum — a site that almost converts, a presence that barely shows up. We treat both as a system.
          </p>
          <p className="mt-3 max-w-[540px] text-[13.8px] font-light leading-relaxed text-white/50" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 160ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 160ms' }}>
            Structure, speed and meaning handled properly, so visitors and models both get it instantly — and know what to do next.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-[560px]" style={{ opacity: in3, transform: `translateY(${(1 - in3) * 10}px)`, transition: 'opacity 560ms ease 200ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 200ms' }}>
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Websites</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Sites that work like products.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/58">Clear hierarchy, fast by default — so the next page isn’t a rebuild.</div>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45"><span className="h-1.5 w-1.5 rounded-full bg-[#8FB6CA]" /> Discoverability</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Found by people and AI.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/58">Schema and semantics so you show up when it counts.</div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden>
          <div className="h-[360px]" />
        </div>
      </div>
    </section>
  )
}
