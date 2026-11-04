import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import type { LegalDoc } from '../content/legal'

/**
 * The privacy policy and the terms share one quiet layout: the short version
 * first, in the voice of the rest of the site, then each part in plain words.
 */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-cream">
      <ScrollRope />
      <Header />
      <main>
        <section className="relative mx-auto w-full max-w-[1240px] px-5 pb-20 pt-36 sm:px-8 lg:px-20 md:pb-28 md:pt-44">
          <Eyebrow>{doc.label}</Eyebrow>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            {doc.heading} <span className="italic text-brand-600">{doc.emphasis}</span>
          </h1>
          <p className="mt-4 text-[13.5px] text-ink-soft">Last updated {doc.updated}</p>

          <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:gap-16">
            <p className="max-w-sm self-start border-l-2 border-brand pl-5 font-display text-[1.35rem] leading-snug text-ink">
              {doc.short}
            </p>
            <div className="border-t border-black/[0.08]">
              {doc.sections.map((section) => (
                <section key={section.heading} className="border-b border-black/[0.08] py-7">
                  <h2 className="font-display text-[1.35rem] leading-tight tracking-[-0.01em] text-ink">{section.heading}</h2>
                  {section.body.map((line) => (
                    <p key={line} className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                      {line}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
