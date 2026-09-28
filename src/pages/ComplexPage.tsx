import Header from '../components/Header'

export default function ComplexPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <section className="mx-auto flex min-h-[86vh] max-w-4xl flex-col items-center justify-center px-6 pt-28 text-center">
        <div className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
          Category 02 — Complex
        </div>
        <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.95] tracking-[-0.03em] text-ink">
          Complex is next.
        </h1>
        <p className="mt-4 max-w-xl text-balance text-[15px] font-light leading-relaxed text-ink-soft">
          We’re finishing <span className="font-medium text-ink">Simple — Websites & AI discoverability</span> first.
          <br />
          Complex — operations, SOPs, systems & automation — will open here. Check back soon.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/simple" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
            See Simple
          </a>
          <a href="/" className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink">
            Back home
          </a>
        </div>
      </section>
    </div>
  )
}
