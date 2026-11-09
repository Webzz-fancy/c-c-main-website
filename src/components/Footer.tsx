import { site } from '../config/site'
import { BLOG_LIVE } from '../content/blog'
import { SERVICES } from '../content/services'
import { useHomeLinks } from '../hooks/useHomeLinks'

type LinkGroup = {
  title: string
  links: { label: string; href: string }[]
}

const GROUPS: LinkGroup[] = [
  {
    title: 'What we build',
    links: SERVICES.filter((service) => service.path !== '/about').map((service) => ({ label: service.name, href: service.path })),
  },
  {
    title: 'Ways we help',
    links: [
      { label: 'What we can do for you', href: '#ways-we-help' },
      { label: 'Book a consultation', href: site.links.booking },
      { label: 'Get your fix plan', href: '#quiz' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'Our projects', href: '/projects' },
      ...(BLOG_LIVE ? [{ label: 'Blog', href: '/blog' }] : []),
      { label: 'Contact', href: '/contact' },
    ],
  },
]

const EMAIL = site.contact.email

/** a profile shows only once it has a real address, never a dead '#' link */
const SOCIAL = [
  { label: 'LinkedIn', href: site.social.linkedin, Icon: LinkedInIcon },
  { label: 'Instagram', href: site.social.instagram, Icon: InstagramIcon },
].filter((item) => item.href.startsWith('http'))

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
  const link = useHomeLinks()
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

            {SOCIAL.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                {SOCIAL.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-brand hover:text-ink"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links + contact */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[1.2fr_1fr_0.8fr_minmax(13rem,1.2fr)]">
            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-glass-300">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <a
                        href={link(item.href)}
                        {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group -my-2 inline-flex items-center py-2 text-[14.5px] text-white/70 transition-colors duration-300 hover:text-white"
                      >
                        <span className="mr-0 h-px w-0 bg-brand transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <address className="col-span-2 not-italic lg:col-span-1" aria-label="Contact">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-glass-300">
                Contact
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="py-2 whitespace-nowrap text-[14.5px] leading-snug text-white/70 transition-colors duration-300 hover:text-brand"
                  >
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={site.contact.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 text-[14.5px] text-white/70 transition-colors duration-300 hover:text-brand"
                  >
                    Message us on WhatsApp
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </div>

        {/* ---------- Lower bar ---------- */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-[13px] text-white/45">
            © {year} Clause &amp; Code. All rights reserved.
          </p>
          {/* the website's own small print, under the contact column */}
          <p className="flex gap-4 text-[13px] text-white/45">
            <a href="/privacy" className="transition-colors duration-300 hover:text-brand">Privacy</a>
            <a href="/terms" className="transition-colors duration-300 hover:text-brand">Terms</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
