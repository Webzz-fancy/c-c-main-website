/**
 * Single source of truth for contact details, links and outbound URLs.
 *
 * Everything a backend or CMS would eventually own lives here, so wiring the
 * site up later means editing this file (or the matching env vars) rather
 * than hunting through components.
 */

const env = import.meta.env

export const site = {
  name: 'Clause & Code',
  tagline: 'From messy to efficient.',
  description:
    'We map your processes and build the SOPs, systems and automations that let your business scale without the backend chaos.',
  url: env.VITE_SITE_URL ?? 'https://clauseandcode.com',

  contact: {
    email: 'support@clauseandcode.com',
    /** the business number, used only as a WhatsApp chat link */
    whatsapp: 'https://wa.me/971509718796',
  },

  social: {
    linkedin: 'https://www.linkedin.com/company/clauseandcode',
    instagram: 'https://www.instagram.com/clauseandcode/',
  },

  /**
   * Outbound destinations. When these move to real pages or a booking tool,
   * set the env vars and every CTA on the site follows.
   */
  links: {
    booking: env.VITE_BOOKING_URL || 'https://calendar.app.google/3xg59Dqk3t21M8B87',
    dropProblem: `mailto:support@clauseandcode.com?subject=${encodeURIComponent('My problem')}&body=${encodeURIComponent('What is not working in my business:\n\n')}`,
    quiz: env.VITE_QUIZ_URL || '#quiz',
    projects: '/complex',
    contact: '/contact',
  },

  /** Base URL for form submissions; empty until a backend exists. */
  apiBaseUrl: env.VITE_API_BASE_URL ?? '',
} as const

export type Site = typeof site
