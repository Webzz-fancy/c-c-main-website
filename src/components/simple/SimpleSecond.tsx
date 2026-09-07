type Props = { progress: number }

/**
 * Section 2 sits on a faded, quieter version of the brand blue #2D6D8B
 * (same hue, lifted and desaturated) so the white copy stays legible and the
 * orange dome of section 3 rises out of it cleanly. The hero's wavy divider
 * and the bridge under the stage use the same value (see SimplePage).
 */
export const SECOND_BG = '#4D7D94'

export default function SimpleSecond({ progress }: Props) {
  const c = Math.max(0, Math.min(1, progress))
  // content comes in as arrow moves — tied to same progress so it feels like
  // one thing. The footer lengthened the page, so the windows run a touch
  // earlier to finish while the section is centred in the viewport.
  const in1 = Math.max(0, Math.min(1, (c - 0.16) / 0.2))
  const in2 = Math.max(0, Math.min(1, (c - 0.22) / 0.2))
  const in3 = Math.max(0, Math.min(1, (c - 0.28) / 0.2))

  return (
    <section
      id="simple-second"
      className="relative overflow-hidden px-6 py-16 sm:py-20 lg:min-h-[92vh] lg:py-28"
      style={{ backgroundColor: SECOND_BG }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-[1.02fr_0.92fr] lg:items-center">
        <div
          className="max-w-[600px]"
          style={{ opacity: in1, transform: `translateY(${(1 - in1) * 14}px)`, transition: 'opacity 520ms ease, transform 720ms cubic-bezier(0.16,1,0.3,1)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">What Simple covers</div>
          <h2 className="mt-4 font-display text-[clamp(1.65rem,3.2vw,2.6rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white" style={{ opacity: in1, transform: `translateY(${(1 - in1) * 10}px)`, transition: 'opacity 560ms ease 60ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 60ms' }}>
            Your website is a system too.
            <br />
            <span className="text-white/85">We build it like one.</span>
          </h2>
          <p className="mt-4 max-w-[540px] text-[14.5px] font-light leading-relaxed text-white/80" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 120ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 120ms' }}>
            Every Simple build starts with the same process mapping we use for operations work: who is visiting, what they need to understand, and what they should do next. Then we design and build a site that answers those three questions with nothing in the way.
          </p>
          <p className="mt-3 max-w-[540px] text-[13.8px] font-light leading-relaxed text-white/65" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 160ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 160ms' }}>
            The result is fast, clearly structured, and easy for both people and AI search to read. Simple to use, because the thinking underneath is not.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-[560px]" style={{ opacity: in3, transform: `translateY(${(1 - in3) * 10}px)`, transition: 'opacity 560ms ease 200ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 200ms' }}>
            <div className="rounded-[18px] border border-white/[0.12] bg-white/[0.08] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Websites</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Built like a product, not a brochure.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/70">Clear structure, quick to load, and easy for your team to update, so the site keeps working as the business grows.</div>
            </div>
            <div className="rounded-[18px] border border-white/[0.12] bg-white/[0.08] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-[#C2D9E5]" /> AI Discoverability</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Found by people and by AI.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/70">Structured data, clean semantics and plain answers, so search engines and AI assistants recommend you when it counts.</div>
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
