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
    phone: '+971 00 000 0000',
  },

  social: {
    linkedin: '#linkedin',
    instagram: '#instagram',
  },

  /**
   * Outbound destinations. When these move to real pages or a booking tool,
   * set the env vars and every CTA on the site follows.
   */
  links: {
    booking: env.VITE_BOOKING_URL || '#book-consultation',
    dropProblem: '#drop-problem',
    quiz: env.VITE_QUIZ_URL || '#quiz',
    projects: '#projects',
    about: '#about',
    contact: '#contact',
    privacy: '#privacy',
  },

  /** Base URL for form submissions; empty until a backend exists. */
  apiBaseUrl: env.VITE_API_BASE_URL ?? '',
} as const

export type Site = typeof site
