import { useState } from 'react'

/**
 * The header's and footer's targets are sections of the home page. On the
 * other pages (/simple, /projects, /contact, /privacy, /terms, /blog) those anchors do not exist, so there
 * "Home" (and the logo) go back to the home page itself and the other links
 * go to the home page's sections. On the home page they stay in-page anchors.
 */
export function useHomeLinks() {
  const [onHome] = useState(
    () => typeof window === 'undefined' || !/^\/(simple|projects|contact|privacy|terms|blog|work|ai-agents|ai-booking-assistant|custom-business-systems|workflow-automation|sop-process-mapping|websites|about)(\/|$)/.test(window.location.pathname),
  )
  return (href: string) => {
    if (onHome || !href.startsWith('#')) return href
    return href === '#home' ? '/' : `/${href}`
  }
}
