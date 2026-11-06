import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollRope from '../components/ScrollRope'
import Eyebrow from '../components/Eyebrow'
import { site } from '../config/site'

const sections = [
  {
    heading: 'What I collect',
    body: 'Your name and email if you send a contact message or ask me to keep a copy of your fix plan, plus the answers you give the quiz.',
  },
  {
    heading: 'Why',
    body: 'To reply and, if you ask, to send you a copy of your plan. I do not sell your data.',
  },
  {
    heading: 'How long I keep it',
    body: 'Only as long as needed to reply and for my own records.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <ScrollRope />
      <Header />
      <main>
        <section className="relative mx-auto w-full max-w-[1240px] px-5 pb-20 pt-36 sm:px-8 lg:px-20 md:pb-28 md:pt-44">
          <div className="pointer-events-none absolute inset-0 grain opacity-30" aria-hidden />
          <div className="relative">
            <Eyebrow>Privacy</Eyebrow>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.04] tracking-[-0.03em] text-ink">
              The small print, <span className="italic text-brand-600">plainly.</span>
            </h1>
            <div className="mt-12 max-w-3xl border-t border-black/[0.08]">
              {sections.map(({ heading, body }) => (
                <section key={heading} className="border-b border-black/[0.08] py-7">
                  <h2 className="font-display text-[1.35rem] leading-tight tracking-[-0.01em] text-ink">{heading}</h2>
                  <p className="mt-3 text-[15px] font-light leading-relaxed text-ink-soft">{body}</p>
                </section>
              ))}
              <section className="border-b border-black/[0.08] py-7">
                <h2 className="font-display text-[1.35rem] leading-tight tracking-[-0.01em] text-ink">How to ask for it to be deleted</h2>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-ink-soft">
                  Email me at <a href={`mailto:${site.contact.email}`} className="text-glass underline underline-offset-4">{site.contact.email}</a> and I will remove it within a week.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
