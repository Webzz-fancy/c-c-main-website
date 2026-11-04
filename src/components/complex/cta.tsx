import { site } from '../../config/site'

// The consultation and the quiz live on the home page (or a booking tool, once
// its URL is set); from a project page a bare anchor has to point back there.
const fromHome = (href: string) => (href.startsWith('#') ? `/${href}` : href)

export const BOOKING = fromHome(site.links.booking)
export const QUIZ = fromHome(site.links.quiz)

/** A booking tool on another site opens in a new tab; home anchors do not. */
export const external = (href: string) => (/^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {})

export function BookButton({ label = 'Book a consultation' }: { label?: string }) {
  return (
    <a className="complex-link complex-link--brand" href={BOOKING} {...external(BOOKING)}>
      {label} <span aria-hidden="true">↗</span>
    </a>
  )
}

export function QuizLink() {
  return (
    <a className="complex-link complex-link--quiet" href={QUIZ} {...external(QUIZ)}>
      Get your fix plan <span aria-hidden="true">→</span>
    </a>
  )
}
