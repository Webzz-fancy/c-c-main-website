import { site } from '../config/site'

/**
 * The contact page: every way to reach us, the one a visitor needs first at
 * the top. The page and its plain HTML copy (static.ts) both read from here.
 */

export type ContactWay = {
  id: 'call' | 'whatsapp' | 'email' | 'problem'
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
  intro: 'A call, a message or a few lines about what isn’t working. A person reads every one, and we tell you honestly whether and how we can help.',
  ways: [
    {
      id: 'call',
      name: 'Book a call',
      body: 'Pick a time on our calendar. We get to know your business and you get an honest read on what to build first.',
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
      body: site.contact.email,
      action: 'Write to us',
      href: `mailto:${site.contact.email}`,
    },
    {
      id: 'problem',
      name: 'Drop your problem',
      body: 'Not sure what you need? Tell us what isn’t working in a few lines and we will tell you how we would fix it.',
      action: 'Describe it',
      href: site.links.dropProblem,
    },
  ] satisfies ContactWay[],
  quiz: {
    lead: 'Not sure where you stand?',
    action: 'Get your business fix plan',
    href: '/#quiz',
  },
  faq: {
    label: 'Questions',
    heading: 'Questions, answered.',
  },
}
