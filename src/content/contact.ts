import { site } from '../config/site'

/**
 * The contact page: every way to reach us, the one a visitor needs first at
 * the top. The page and its plain HTML copy (static.ts) both read from here.
 */

export type ContactWay = {
  id: 'call' | 'whatsapp' | 'email'
  name: string
  body: string
  action: string
  href: string
  external?: boolean
}

export const CONTACT = {
  label: 'Contact',
  heading: 'Talk to us.',
  emphasis: 'However suits you.',
  intro: 'A call, a message or a few lines about what isn’t working. We read every one, and we tell you honestly whether and how we can help.',
  ways: [
    {
      id: 'call',
      name: 'Book a consultation',
      body: site.consultation,
      action: 'Pick a time',
      href: site.links.booking,
      external: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      body: 'Message us the way you message anyone else. Good for a quick question before you book.',
      action: 'Open WhatsApp',
      href: site.contact.whatsapp,
      external: true,
    },
    {
      id: 'email',
      name: 'Email',
      body: 'Not sure what you need yet? A few lines about what isn’t working is plenty.',
      action: site.contact.email,
      href: `mailto:${site.contact.email}`,
    },
  ] satisfies ContactWay[],
  quiz: {
    lead: 'Not sure where you stand?',
    action: 'Get your fix plan',
    href: '/#quiz',
  },
  faq: {
    label: 'Questions',
    heading: 'Questions, answered.',
  },
}
