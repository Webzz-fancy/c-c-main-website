import { useEffect, useRef, useState } from 'react'
import { useScrolled } from '../hooks/useScrolled'
import { useRobotMood } from '../context/RobotMood'

type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string; description: string }[]
}

const NAV: NavItem[] = [
  { label: 'Home', href: '#home' },
  {
    label: 'Ways We Help',
    href: '#ways-we-help',
    children: [
      {
        label: 'Book a Consultation',
        href: '#book-consultation',
        description: 'A focused 1:1 session to map the fix.',
      },
      {
        label: 'Drop Your Problem',
        href: '#drop-problem',
        description: 'Tell us what’s broken, we’ll point the way.',
      },
    ],
  },
  { label: 'Our Projects', href: '#projects' },
  { label: 'About Us', href: '#about' },
]

function Logo() {
  return (
    <a
      href="#home"
      className="group flex shrink-0 items-center"
      aria-label="Clause & Code — home"
    >
      <img
        src="/logo.png"
        alt="Clause & Code"
        width={432}
        height={160}
        className="h-[26px] w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-7"
        draggable={false}
      />
    </a>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  )
}

export default function Header() {
  const scrolled = useScrolled(20)
  const { moodHandlers } = useRobotMood()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  const openMenu = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpenDropdown(label)
  }

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenDropdown(null), 140)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-0 pt-4 md:pt-5">
      <div
        className={[
          'mx-auto flex items-center justify-between gap-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          scrolled
            ? 'max-w-[min(1440px,calc(100%-100px))] rounded-full border border-black/[0.06] bg-white/95 px-5 py-2.5 shadow-capsule backdrop-blur-xl sm:px-6'
            : 'max-w-[min(1440px,calc(100%-80px))] rounded-full border border-transparent bg-transparent px-2 py-3 shadow-none',
        ].join(' ')}
      >
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const isOpen = openDropdown === item.label
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && openMenu(item.label)}
                onMouseLeave={() => item.children && scheduleClose()}
              >
                <a
                  href={item.href}
                  aria-haspopup={item.children ? 'true' : undefined}
                  aria-expanded={item.children ? isOpen : undefined}
                  className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-ink-soft transition-colors duration-300 hover:text-ink"
                >
                  {item.label}
                  {item.children && <ChevronIcon open={isOpen} />}
                  <span
                    className="pointer-events-none absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                </a>

                {item.children && (
                  <div
                    className={[
                      'absolute left-1/2 top-full w-[290px] -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isOpen
                        ? 'pointer-events-auto translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-2 opacity-0',
                    ].join(' ')}
                  >
                    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-2 shadow-soft">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="group/item flex flex-col gap-0.5 rounded-xl px-3.5 py-3 transition-colors duration-200 hover:bg-brand-50"
                        >
                          <span className="flex items-center justify-between text-[14px] font-semibold text-ink">
                            {child.label}
                            <span className="translate-x-0 text-brand opacity-0 transition-all duration-300 group-hover/item:translate-x-1 group-hover/item:opacity-100">
                              →
                            </span>
                          </span>
                          <span className="text-[12.5px] leading-snug text-ink-muted">
                            {child.description}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            {...moodHandlers('surprised')}
            className="hidden items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-ink shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-300 hover:shadow-[0_18px_34px_-12px_rgba(225,173,52,0.8)] active:translate-y-0 sm:flex"
          >
            Contact Us
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="grid h-10 w-10 place-items-center rounded-full border border-black/[0.08] bg-white/80 text-ink backdrop-blur lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 block h-[1.6px] w-4 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-[5px] rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-[5px] block h-[1.6px] w-4 bg-current transition-all duration-300 ${
                  mobileOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-[1.6px] w-4 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-[5px] -rotate-45' : 'top-[10px]'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={[
          'mx-auto mt-3 max-w-[calc(100%-32px)] overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-soft transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden',
          mobileOpen ? 'max-h-[520px] opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0 shadow-none',
        ].join(' ')}
      >
        <nav className="flex flex-col p-3" aria-label="Mobile">
          {NAV.map((item) => (
            <div key={item.label} className="border-b border-black/[0.05] last:border-0">
              <a
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 text-[15px] font-medium text-ink"
              >
                {item.label}
              </a>
              {item.children && (
                <div className="pb-2 pl-5">
                  {item.children.map((child) => (
                    <a
                      key={child.label}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-[14px] text-ink-muted"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="mt-3 rounded-full bg-brand px-5 py-3 text-center text-[15px] font-semibold text-ink"
          >
            Contact Us
          </a>
        </nav>
      </div>
    </header>
  )
}
