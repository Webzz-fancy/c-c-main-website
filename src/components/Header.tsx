import { useEffect, useRef, useState } from 'react'
import { useScrolled } from '../hooks/useScrolled'
import { useHomeLinks } from '../hooks/useHomeLinks'
import { useRobotMood } from '../context/RobotMood'
import { COMPLEX, PROJECT_GROUPS } from '../content/complex'

type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string; description: string }[]
  /** a wide menu listing every project; the label itself still opens the page */
  projects?: boolean
}

type ProjectLink = { id: string; label: string; href: string; description: string; external?: boolean }

// Every project, grouped the way the menu shows them. Each one opens the
// projects page with its details already open.
const PROJECT_MENU: { label: string; items: ProjectLink[] }[] = PROJECT_GROUPS.map((group) => ({
  label: group.label,
  items:
    group.id === 'ai'
      ? [{
          id: 'agents',
          label: 'AI agents',
          href: '/complex#agents',
          description: 'A director, agent teams and one queue of decisions',
        }, {
          id: COMPLEX.discoverability.id,
          label: COMPLEX.discoverability.name,
          href: COMPLEX.discoverability.url,
          description: 'AI discoverability',
          external: true,
        }]
      : COMPLEX.projects
          .filter((project) => project.group === group.id)
          .map((project) => ({
            id: project.id,
            label: project.card.name,
            href: `/complex#project-${project.id}`,
            description: project.card.area,
          })),
}))

function ProjectMenuLink({ item, onPick }: { item: ProjectLink; onPick: () => void }) {
  return (
    <a
      href={item.href}
      onClick={onPick}
      {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
      className="group/item flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-brand-50"
    >
      <span className="flex items-center justify-between gap-3 text-[14px] font-semibold text-ink">
        {item.label}
        <span className="translate-x-0 text-brand opacity-0 transition-all duration-300 group-hover/item:translate-x-1 group-hover/item:opacity-100">
          {item.external ? '↗' : '→'}
        </span>
      </span>
      <span className="text-[12px] leading-snug text-ink-muted">{item.description}</span>
    </a>
  )
}

const NAV: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Our Projects', href: '/complex', projects: true },
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
]

function Logo({ href }: { href: string }) {
  return (
    <a
      href={href}
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
  const [mobileSub, setMobileSub] = useState<string | null>(null)
  const closeTimer = useRef<number | null>(null)
  const link = useHomeLinks()

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  // a menu opened by click closes on Escape or on a click anywhere outside it
  useEffect(() => {
    if (!openDropdown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null)
    }
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-nav-menu]')) setOpenDropdown(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [openDropdown])

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
        <Logo href={link('#home')} />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const isOpen = openDropdown === item.label
            return (
              <div
                key={item.label}
                data-nav-menu={item.children || item.projects ? '' : undefined}
                className="relative"
                onMouseEnter={() => (item.children || item.projects) && openMenu(item.label)}
                onMouseLeave={() => (item.children || item.projects) && scheduleClose()}
                onBlur={(e) => {
                  if (item.projects && !e.currentTarget.contains(e.relatedTarget as Node)) scheduleClose()
                }}
              >
                {item.projects ? (
                  // the label goes to the projects page; hovering or focusing
                  // it shows every project, so a visitor can go straight to one
                  <a
                    href={link(item.href)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onFocus={() => openMenu(item.label)}
                    className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {item.label}
                    <ChevronIcon open={isOpen} />
                    <span
                      className="pointer-events-none absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  </a>
                ) : item.children ? (
                  // a parent item is a menu trigger, not a link: clicking it
                  // opens (or closes) the menu and never scrolls the page
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => (isOpen ? setOpenDropdown(null) : openMenu(item.label))}
                    className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {item.label}
                    <ChevronIcon open={isOpen} />
                    <span
                      className="pointer-events-none absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <a
                    href={link(item.href)}
                    className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {item.label}
                    <span
                      className="pointer-events-none absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  </a>
                )}

                {item.projects && (
                  <div
                    className={[
                      'absolute left-1/2 top-full w-[640px] -translate-x-1/2 pt-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isOpen
                        ? 'pointer-events-auto visible translate-y-0 opacity-100'
                        : 'pointer-events-none invisible translate-y-2 opacity-0',
                    ].join(' ')}
                  >
                    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3 shadow-soft">
                      <div className="grid grid-cols-2 gap-x-3">
                        <div>
                          <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-glass">{PROJECT_MENU[0].label}</p>
                          {PROJECT_MENU[0].items.map((p) => <ProjectMenuLink key={p.id} item={p} onPick={() => setOpenDropdown(null)} />)}
                        </div>
                        <div>
                          {PROJECT_MENU.slice(1).map((group) => (
                            <div key={group.label}>
                              <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-glass">{group.label}</p>
                              {group.items.map((p) => <ProjectMenuLink key={p.id} item={p} onPick={() => setOpenDropdown(null)} />)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <a
                        href={link(item.href)}
                        onClick={() => setOpenDropdown(null)}
                        className="mt-2 flex items-center justify-between rounded-xl bg-cream px-3.5 py-3 text-[13.5px] font-semibold text-ink transition-colors duration-200 hover:bg-brand-50"
                      >
                        See all projects
                        <span className="text-brand" aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                )}

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
                          href={link(child.href)}
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
            href={link('#contact')}
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
          mobileOpen ? 'max-h-[min(860px,calc(100svh-96px))] overflow-y-auto opacity-100' : 'pointer-events-none max-h-0 border-transparent opacity-0 shadow-none',
        ].join(' ')}
      >
        <nav className="flex flex-col p-3" aria-label="Mobile">
          {NAV.map((item) => (
            <div key={item.label} className="border-b border-black/[0.05] last:border-0">
              {item.children || item.projects ? (
                <button
                  type="button"
                  aria-expanded={mobileSub === item.label}
                  onClick={() => setMobileSub((v) => (v === item.label ? null : item.label))}
                  className="flex w-full items-center justify-between px-3 py-3 text-left text-[15px] font-medium text-ink"
                >
                  {item.label}
                  <ChevronIcon open={mobileSub === item.label} />
                </button>
              ) : (
                <a
                  href={link(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-[15px] font-medium text-ink"
                >
                  {item.label}
                </a>
              )}
              {item.projects && (
                <div
                  className={[
                    'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    mobileSub === item.label ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  ].join(' ')}
                >
                  <div className="overflow-hidden">
                    <div className="pb-2 pl-5">
                      <a
                        href={link(item.href)}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 text-[14px] font-semibold text-ink"
                      >
                        All projects
                      </a>
                      {PROJECT_MENU.flatMap((group) => group.items).map((p) => (
                        <a
                          key={p.id}
                          href={p.href}
                          onClick={() => setMobileOpen(false)}
                          {...(p.external ? { target: '_blank', rel: 'noopener' } : {})}
                          className="block py-2 text-[14px] text-ink-muted"
                        >
                          {p.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {item.children && (
                <div
                  className={[
                    'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    mobileSub === item.label ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  ].join(' ')}
                >
                  <div className="overflow-hidden">
                    <div className="pb-2 pl-5">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={link(child.href)}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-[14px] text-ink-muted"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <a
            href={link('#contact')}
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
