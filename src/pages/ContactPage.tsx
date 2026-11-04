import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import { CONTACT } from '../content/contact'
import { FAQ } from '../config/seo'

const external = (on?: boolean) => (on ? { target: '_blank', rel: 'noopener' } : {})

/**
 * Every way to reach us, then the questions people ask before they do. The
 * call leads in gold; the other ways answer in the blue.
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream">
      <ScrollRope />
      <Header />
      <main>
        <section className="relative mx-auto w-full max-w-[1240px] px-5 pb-16 pt-36 sm:px-8 lg:px-20 md:pb-20 md:pt-44">
          <Eyebrow>{CONTACT.label}</Eyebrow>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[1.02] tracking-[-0.03em] text-ink">
            {CONTACT.heading}{' '}
            <span className="italic text-brand-600">{CONTACT.emphasis}</span>
          </h1>
          <p className="mt-6 max-w-xl text-[clamp(1rem,1.2vw,1.1rem)] leading-relaxed text-ink-soft">{CONTACT.intro}</p>

          <ul className="mt-14 border-t border-black/[0.08]">
            {CONTACT.ways.map((way, i) => (
              <li
                key={way.id}
                className="grid gap-x-10 gap-y-3 border-b border-black/[0.08] py-7 md:grid-cols-[240px_1fr_auto] md:items-center"
              >
                <h2 className="font-display text-[1.6rem] leading-tight tracking-[-0.015em] text-ink">{way.name}</h2>
                <p className="max-w-lg text-[15px] leading-relaxed text-ink-soft">
                  {way.body}
                </p>
                <a
                  href={way.href}
                  {...external(way.external)}
                  className={
                    i === 0
                      ? 'inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-ink shadow-brand transition-colors duration-300 hover:bg-brand-300'
                      : 'inline-flex w-fit items-center gap-2 rounded-full border border-glass/30 px-6 py-3 text-[14px] font-semibold text-glass-600 transition-colors duration-300 hover:border-glass hover:bg-white'
                  }
                >
                  {way.action} <span aria-hidden="true">{way.external ? '↗' : '→'}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-[15px] text-ink-soft">
            {CONTACT.quiz.lead}{' '}
            <a href={CONTACT.quiz.href} className="font-semibold text-glass-600 underline decoration-glass/30 underline-offset-4 hover:decoration-glass">
              {CONTACT.quiz.action}
            </a>
          </p>
        </section>

        <section id="faq" className="border-t border-black/[0.06] bg-white/60" aria-labelledby="faq-title">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-20 sm:px-8 lg:px-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:py-24">
            <div>
              <Eyebrow>{CONTACT.faq.label}</Eyebrow>
              <h2 id="faq-title" className="mt-5 font-display text-[clamp(2.2rem,4.2vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink">
                {CONTACT.faq.heading}
              </h2>
            </div>
            <div className="border-t border-black/[0.08]">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group border-b border-black/[0.08]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-glass/30 text-glass transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 pr-12 text-[15px] leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
