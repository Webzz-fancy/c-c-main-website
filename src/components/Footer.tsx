import { site } from '../config/site'

type LinkGroup = {
  title: string
  links: { label: string; href: string }[]
}

const GROUPS: LinkGroup[] = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#privacy' },
    ],
  },
  {
    title: 'Ways We Help',
    links: [
      { label: 'Book a Consultation', href: '#book-consultation' },
      { label: 'Drop Your Problem', href: '#drop-problem' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'Our Projects', href: '#projects' },
      { label: 'Take the Quiz', href: '#quiz' },
    ],
  },
]

const EMAIL = site.contact.email
const PHONE = site.contact.phone

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0M3.4 8.9h3.1V21H3.4zM9.3 8.9h2.97v1.65h.04c.41-.78 1.42-1.6 2.93-1.6 3.13 0 3.71 2.06 3.71 4.74V21h-3.1v-5.66c0-1.35-.02-3.09-1.88-3.09-1.88 0-2.17 1.47-2.17 2.99V21H9.3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative w-full overflow-hidden bg-[#12262F] text-white/70">
      {/* ---------- Depth: diagonal sheen + warm glow ---------- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,0.18) 100%)',
          }}
        />
        <div
          className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45,109,139,0.08) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
        <div
          className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(45,109,139,0.42) 0%, rgba(45,109,139,0) 70%)',
          }}
        />
        {/* Hairline at the very top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        {/* ---------- Upper ---------- */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] md:py-20">
          {/* Brand */}
          <div>
            <img
              src="/logo.png"
              alt="Clause & Code"
              width={432}
              height={160}
              className="h-7 w-auto brightness-0 invert"
              draggable={false}
            />

            <p className="mt-5 flex items-center gap-3 font-display text-[19px] leading-snug text-white/90">
              <span>
                From <em className="italic text-brand">messy</em> to efficient.
              </span>
              <img
                src="/robot-mark.png"
                alt=""
                width={53}
                height={96}
                className="h-[38px] w-auto shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                draggable={false}
              />
            </p>

            <div className="mt-7 flex items-center gap-3">
              {[
                { label: 'LinkedIn', href: site.social.linkedin, Icon: LinkedInIcon },
                { label: 'Instagram', href: site.social.instagram, Icon: InstagramIcon },
              ].map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-brand hover:text-ink"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Links + contact */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="group inline-flex items-center text-[14.5px] text-white/70 transition-colors duration-300 hover:text-white"
                      >
                        <span className="mr-0 h-px w-0 bg-brand transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Contact
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-[14.5px] leading-snug text-white/70 transition-colors duration-300 hover:text-brand"
                  >
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${PHONE.replace(/\s/g, '')}`}
                    className="text-[14.5px] text-white/70 transition-colors duration-300 hover:text-brand"
                  >
                    {PHONE}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ---------- Lower bar ---------- */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-[13px] text-white/45">
            © {year} Clause &amp; Code. All rights reserved.
          </p>
          <p className="text-[13px] text-white/45">
            Operations, systems &amp; AI for growing businesses.
          </p>
        </div>
      </div>
    </footer>
  )
}
