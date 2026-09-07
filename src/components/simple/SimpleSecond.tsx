type Props = { progress: number }

/**
 * Section 2 sits on a faded, quieter version of the brand blue #2D6D8B
 * (same hue, lifted and desaturated) so the white copy stays legible and the
 * orange dome of section 3 rises out of it cleanly. The hero's wavy divider
 * and the bridge under the stage use the same value (see SimplePage).
 *
 * The glass here is the home page's, in its "on colour" form: a frosted
 * white plate with the light coming from the top left, a specular top edge,
 * and soft light blooms behind it so the blur has something to catch.
 */
export const SECOND_BG = '#4D7D94'

// the plate tint is thin on purpose: on a saturated ground a heavy frost
// reads as an opaque slab. It catches the light at the top left (as on the
// home boxes) and smokes towards the bottom right, so the white copy keeps
// its contrast where the paragraphs and the cards sit.
const PLATE_BG = 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 36%, rgba(18,44,56,0.06) 68%, rgba(18,44,56,0.14) 100%)'
const CARD_BG = 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'

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
      {/* ---------- ambient: grain + light blooms behind the glass ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* cool light, upper left, behind the plate */}
        <div
          className="absolute -left-40 -top-24 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 68%)' }}
        />
        {/* warm light, lower right, under the robot: the hero's orange, carried through */}
        <div
          className="absolute -bottom-32 -right-32 h-[620px] w-[760px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,173,52,0.14) 0%, rgba(225,173,52,0) 68%)' }}
        />
        {/* a deeper pool of the base blue, top right, for depth behind the robot */}
        <div
          className="absolute -right-20 top-[8%] h-[520px] w-[620px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(45,109,139,0.30) 0%, rgba(45,109,139,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1240px] grid-cols-1 gap-10 lg:grid-cols-[1.02fr_0.92fr] lg:items-center">
        {/* ---------- the glass plate ---------- */}
        <div
          className="relative isolate max-w-[640px] rounded-[26px] border border-white/[0.18] px-6 py-7 shadow-[0_40px_100px_-40px_rgba(10,30,40,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] sm:rounded-[30px] sm:px-9 sm:py-9"
          style={{
            background: PLATE_BG,
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            opacity: in1,
            transform: `translateY(${(1 - in1) * 14}px)`,
            transition: 'opacity 520ms ease, transform 720ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* specular highlight along the top edge */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px] sm:rounded-[30px]" aria-hidden>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 45%, transparent)' }} />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            <span className="flex items-center gap-2" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="h-px w-7 bg-gradient-to-r from-brand/70 to-transparent" />
            </span>
            What Simple covers
          </div>
          <h2 className="mt-4 font-display text-[clamp(1.65rem,3.2vw,2.6rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white" style={{ opacity: in1, transform: `translateY(${(1 - in1) * 10}px)`, transition: 'opacity 560ms ease 60ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 60ms' }}>
            Your website is a system too.
            <br />
            <span className="text-white/85">We build it like one.</span>
          </h2>
          <p className="mt-4 max-w-[540px] text-[14.5px] font-light leading-relaxed text-white/90" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 120ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 120ms' }}>
            Every Simple build starts with the same process mapping we use for operations work: who is visiting, what they need to understand, and what they should do next. Then we design and build a site that answers those three questions with nothing in the way.
          </p>
          <p className="mt-3 max-w-[540px] text-[13.8px] font-light leading-relaxed text-white/80" style={{ opacity: in2, transform: `translateY(${(1 - in2) * 10}px)`, transition: 'opacity 560ms ease 160ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 160ms' }}>
            The result is fast, clearly structured, and easy for both people and AI search to read. Simple to use, because the thinking underneath is not.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ opacity: in3, transform: `translateY(${(1 - in3) * 10}px)`, transition: 'opacity 560ms ease 200ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 200ms' }}>
            <div className="rounded-[18px] border border-white/[0.14] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" style={{ background: CARD_BG }}>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Websites</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Built like a product, not a brochure.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/82">Clear structure, quick to load, and easy for your team to update, so the site keeps working as the business grows.</div>
            </div>
            <div className="rounded-[18px] border border-white/[0.14] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" style={{ background: CARD_BG }}>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65"><span className="h-1.5 w-1.5 rounded-full bg-[#C2D9E5]" /> AI Discoverability</div>
              <div className="mt-2 text-[14px] font-medium leading-snug text-white">Found by people and by AI.</div>
              <div className="mt-1.5 text-[13px] font-light leading-relaxed text-white/82">Structured data, clean semantics and plain answers, so search engines and AI assistants recommend you when it counts.</div>
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
