import { COMPLEX, type ComplexProject } from './complex'

/**
 * Each project's own page, at /work/<slug>. Visitors browsing /projects still
 * open a project in its popup; this is the address search engines, AI
 * assistants and shared links land on. The page's words come from the same
 * project in complex.ts, so the popup and the page always match.
 *
 * Titles under 60 characters, descriptions 140 to 160, no invented figures,
 * and no client names (see the note at the top of complex.ts).
 */
export const WORK: Record<string, { slug: string; title: string; description: string }> = {
  bidding: {
    slug: 'expert-matching-bidding-platform',
    title: 'Expert Matching and Bidding Platform | Clause & Code',
    description:
      'A custom system that suggests the experts who fit each project, sends invitations from one screen and keeps every bid in one place, with no public listing.',
  },
  community: {
    slug: 'teacher-vetting-matching-platform',
    title: 'Teacher Vetting and Matching Platform | Clause & Code',
    description:
      'A platform that takes every teacher through seven vetting stages, then shows each student only approved teachers who fit their goal and level.',
  },
  academy: {
    slug: 'academy-management-platform',
    title: 'Academy Management Platform | Clause & Code',
    description:
      'One system to run an academy in English and Arabic: online registration, classes, attendance, progress, fees and reports, with each person seeing their part.',
  },
  'client-app': {
    slug: 'client-journey-platform',
    title: 'Client Journey Platform for Bookings | Clause & Code',
    description:
      'A client app, admin system and owner dashboard built as one platform, with bookings, reminders, follow ups, reviews and referrals handled automatically.',
  },
  orders: {
    slug: 'b2b-order-pipeline',
    title: 'B2B Order Pipeline Automation | Clause & Code',
    description:
      'We mapped how B2B enquiries moved, then built one pipeline from enquiry to dispatch, with automatic assignment, reminders and a written SOP for the team.',
  },
  'quiz-funnel': {
    slug: 'quiz-funnel-program-delivery',
    title: 'Quiz Funnel and Program Delivery | Clause & Code',
    description:
      'A landing page with a scored quiz, a personal result for every visitor, and an email sequence that runs an online program from payment to final feedback.',
  },
  membership: {
    slug: 'membership-system',
    title: 'Membership System, Strategy to Launch | Clause & Code',
    description:
      'A paid membership designed and built from the ground up: the model and numbers, application site, team workspace, payments, welcome emails and contracts.',
  },
  'website-journey': {
    slug: 'in-person-experience-website',
    title: 'Websites for Makers and Artists | Clause & Code',
    description:
      'Websites for makers, artisans, artists and brands: the story unfolds as visitors scroll, every piece is seen up close, and ordering happens on the page.',
  },
}

export const workPath = (project: ComplexProject) => `/work/${WORK[project.id].slug}`

export const projectBySlug = (slug: string) =>
  COMPLEX.projects.find((project) => WORK[project.id]?.slug === slug)
