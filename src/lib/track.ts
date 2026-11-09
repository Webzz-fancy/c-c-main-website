import { site } from '../config/site'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, string> }) => void
  }
}

/** Counts clicks on any booking link and the page they came from. Does
 *  nothing until the visitor counter's script is on the page. */
export function trackBookingClicks() {
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element).closest('a')
      if (link?.href === site.links.booking) {
        window.plausible?.('Book a consultation', { props: { page: window.location.pathname } })
      }
    },
    true,
  )
}
