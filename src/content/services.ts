import { COMPLEX } from './complex'
import { HOME_APPROACH } from './home'

/**
 * One page per service. The pages, the crawler copy, the sitemap, llms.txt
 * and the footer all read from this list.
 *
 * Writing rules: only what the projects and the rest of the site already say.
 * No invented figures, clients or promises. Keep `draft: true` on anything
 * with unconfirmed facts: drafts show on the local preview only, and the
 * live build never writes them.
 */

export type ServiceItem = { title?: string; body: string }
export type ServiceSection = {
  heading: string
  intro?: string
  style: 'cards' | 'steps' | 'list'
  items: ServiceItem[]
}

export type Service = {
  path: string
  /** short name: footer, breadcrumbs, llms.txt */
  name: string
  title: string
  description: string
  summary: string
  serviceType: string
  label: string
  heading: string
  emphasis: string
  intro: string[]
  sections: ServiceSection[]
  /** project ids from complex.ts, closest first */
  projects: string[]
  /** list the websites from the portfolio */
  portfolio?: boolean
  faq: { q: string; a: string }[]
  close: { heading: string; body: string }
  draft?: boolean
}

const need = (id: string, title?: string): ServiceItem => {
  const found = COMPLEX.finder.needs.find((n) => n.id === id)
  if (!found) throw new Error(`Unknown need: ${id}`)
  return { title: title ?? found.label, body: found.plan }
}

const APPROACH: ServiceSection = {
  heading: `${HOME_APPROACH.heading} ${HOME_APPROACH.emphasis}`,
  intro: HOME_APPROACH.intro,
  style: 'steps',
  items: HOME_APPROACH.steps.map((step) => ({ title: step.title, body: step.body })),
}

const { agents } = COMPLEX

const ALL: Service[] = [
  {
    path: '/ai-agents',
    name: 'AI agents',
    title: 'Custom AI Agents for Small Businesses | Clause & Code',
    description:
      'AI agents customised to your business that answer enquiries, follow up leads and write reports. Anything for a client or involving money waits for your yes.',
    summary:
      'Custom AI agents for small and growing businesses: what they take on, what still needs your approval, how we set them up, and examples for eight kinds of business.',
    serviceType: 'AI agents for small and growing businesses',
    label: 'AI agents',
    heading: 'Custom AI agents.',
    emphasis: 'You approve. They do the rest.',
    intro: [
      agents.intro,
      'Each agent takes on one job, and a director agent plans the day and checks their work, so replies, follow ups and reports stop waiting for someone to find the time.',
    ],
    sections: [
      {
        heading: 'What the agents take on',
        style: 'cards',
        items: [
          { title: agents.director.name, body: `${agents.director.job.replace(/ · /g, ', ')}.` },
          ...agents.teams.map((team) => ({ title: team.name, body: `${team.job.replace(/ · /g, ', ')}.` })),
        ],
      },
      {
        heading: agents.control.label,
        style: 'cards',
        items: agents.control.steps.map((step) => ({ title: step.level, body: step.what })),
      },
      {
        heading: agents.setup.label,
        style: 'steps',
        items: agents.setup.steps.map((step) => ({ title: step.step, body: `${step.what}.` })),
      },
      {
        heading: 'What agents could do for your kind of business',
        intro: 'These are examples of what is possible, shaped to each business when we map it.',
        style: 'cards',
        items: agents.industries.items.map((item) => ({
          title: item.label,
          body: `${item.clients[0]}. ${item.operations[0]}.`,
        })),
      },
    ],
    projects: ['orders', 'client-app', 'academy'],
    faq: [
      {
        q: 'What needs my approval?',
        a: 'Anything sent to a client or the public, and anything involving money or a commitment, waits for you. Research, drafts and internal records run by themselves, and every job and decision is written down.',
      },
      {
        q: 'Can a small business use AI agents?',
        a: 'Yes. We map how your work moves, build the agents around your tools and rules, test them beside your team, and keep them running.',
      },
      {
        q: 'Do you work in Arabic?',
        a: 'Yes. We work in English and Arabic, with businesses in the UAE and worldwide.',
      },
    ],
    close: {
      heading: 'Tell us which work keeps waiting.',
      body: 'We will show you which jobs an agent could take on first, and what should stay with your team.',
    },
  },
  {
    path: '/custom-business-systems',
    name: 'Custom business systems',
    title: 'Custom Business Systems in the UAE | Clause & Code',
    description:
      'One system for the work spreadsheets and inboxes can no longer hold. We map how your business runs, then build around it, in English, Arabic or both.',
    summary:
      'Custom business systems built from a map of how the work actually moves: what they replace, how we build them, and the platforms we have delivered.',
    serviceType: 'Business process mapping, custom business systems and workflow design',
    label: 'Custom business systems',
    heading: 'One system for the work.',
    emphasis: 'Built around how it really runs.',
    intro: [
      'When the work lives across spreadsheets, inboxes and people’s heads, handoffs get lost and the numbers have to be rebuilt by hand.',
      'We map how your business actually runs, then build one place for it, where every handoff moves along by itself and each person sees only their part.',
    ],
    sections: [
      {
        heading: 'What a custom system can take over',
        style: 'cards',
        items: [
          need('scattered'),
          need('handoffs'),
          need('people'),
          need('bookings'),
          need('payments'),
          need('reports', 'Reports'),
        ],
      },
      APPROACH,
    ],
    projects: ['bidding', 'community', 'academy', 'client-app'],
    faq: [
      {
        q: 'What custom business systems have you built?',
        a: 'An expert matching and bidding platform, a seven stage teacher vetting and matching system, an academy management platform in English and Arabic, and a client journey platform, among others. Each one started with a map of how the work actually moved.',
      },
      {
        q: 'Can a system run in English and Arabic?',
        a: 'Yes. We work in English and Arabic and have built systems that run in both.',
      },
      {
        q: 'Who is a custom system for?',
        a: 'Founders and growing businesses whose operations have outgrown the way they run: too much held in people’s heads, tools that do not talk to each other, and work that stalls when one person is away.',
      },
    ],
    close: {
      heading: 'Not sure a system is what you need?',
      body: 'Sometimes the first fix is much smaller. Tell us how things run today, and we will tell you what we would fix first.',
    },
  },
  {
    path: '/workflow-automation',
    name: 'Workflow automation',
    title: 'Workflow Automation for Growing Teams | Clause & Code',
    description:
      'We map how your work moves, find where it stalls, then automate the handoffs, reminders and emails. Enquiries, orders, sign ups and payments, end to end.',
    summary:
      'Workflow automation mapped before it is built: order pipelines, funnels, onboarding, payments and reminders, with examples of what we have automated.',
    serviceType: 'Workflow automation',
    label: 'Workflow automation',
    heading: 'Map the work first.',
    emphasis: 'Then automate what should move by itself.',
    intro: [
      'Automating a messy process only makes the mess move faster. So we first trace how the work really moves, who does what, where it waits and where it gets lost.',
      'Then we automate the handoffs, reminders and emails, so each step moves on to the next person by itself.',
    ],
    sections: [
      {
        heading: 'What we automate',
        style: 'cards',
        items: [need('handoffs'), need('enquiries'), need('onboarding'), need('selling'), need('payments')],
      },
      APPROACH,
    ],
    projects: ['orders', 'quiz-funnel', 'membership'],
    faq: [
      {
        q: 'What still needs a person?',
        a: 'The decisions that matter. In the B2B order pipeline we built, the founder still reviews each new enquiry and approves or rejects it, and the automation takes care of assigning the work and sending the reminders.',
      },
      {
        q: 'Do you document the process too?',
        a: 'Yes. We set it up with your team, train them and write it all down. The B2B order pipeline, for example, came with a written SOP and video walkthroughs.',
      },
    ],
    close: {
      heading: 'Where does your work get stuck?',
      body: 'Tell us about the step that always waits on someone, and we will start there.',
    },
  },
  {
    path: '/sop-process-mapping',
    name: 'SOPs and process mapping',
    title: 'SOPs and Process Mapping in the UAE | Clause & Code',
    description:
      'We sit with your team, map how the work really moves, and write SOPs people will actually use. For UAE businesses and worldwide, in English and Arabic.',
    summary:
      'Business process mapping and standard operating procedures: what gets mapped, what you receive, and how the map becomes documentation, systems and automation.',
    serviceType: 'Business process mapping and standard operating procedures (SOPs)',
    label: 'SOPs and process mapping',
    heading: 'Get it out of people’s heads.',
    emphasis: 'And into a process that holds.',
    intro: [
      'When the work depends on who remembers what, it stalls the moment one person is away.',
      'We sit with you and your team, trace how the work actually moves, and turn it into a clear map and SOPs built around how your business runs.',
    ],
    sections: [
      {
        heading: 'What we map and write',
        style: 'cards',
        items: [
          { title: 'How the work moves', body: 'The flow of information, the decision points, and each step from start to finish.' },
          { title: 'Who does what', body: 'Team responsibilities, so every step has one clear owner.' },
          { title: 'Where it gets stuck', body: 'Where work waits, where it gets lost, and where friction exists.' },
          { title: 'SOPs built around you', body: 'Documentation written from how your business really runs, rather than a template.' },
          { title: 'Adoption', body: 'We set it up with your team and train them, so it actually gets used.' },
          { title: 'What comes next', body: 'The map shows where automation and AI would create real efficiency, and where they would not.' },
        ],
      },
      APPROACH,
    ],
    projects: ['orders', 'membership'],
    faq: [
      {
        q: 'What does process mapping cover?',
        a: 'Information flow, decision points, team responsibilities and where friction exists. We trace how the work actually moves, which is often different from how it is written down.',
      },
      {
        q: 'Should we write SOPs before automating?',
        a: 'Map first. Everything we build comes from the map, so you automate a process that works rather than one that only looks right on paper.',
      },
      {
        q: 'Do you work with businesses in the UAE?',
        a: 'Yes. We are based in the UAE and work with businesses in the UAE and worldwide, in English and Arabic.',
      },
    ],
    close: {
      heading: 'Start with one process.',
      body: 'Pick the one that causes the most chasing. In a 45 minute call, tell us how it runs today and you will leave knowing what we would fix first.',
    },
  },
  {
    path: '/websites',
    name: 'Websites',
    title: 'Websites Built Around Your Visitors | Clause & Code',
    description:
      'Websites mapped around who visits and what they came to do: fast, easy to keep current, and structured so search engines and AI assistants can read them.',
    summary:
      'Website design and development mapped around what visitors come to do, including websites for makers, artisans, artists and brands, with recent builds.',
    serviceType: 'Website design and development',
    label: 'Websites',
    heading: 'A website with a job to do.',
    emphasis: 'Designed around why people visit.',
    intro: [
      'A website is the front of a business. We build it with the same care we bring to the operations behind one.',
      'We map who is visiting and what they came to do before a single page is designed. Then we build it fast, structured and easy to keep current.',
    ],
    sections: [
      {
        heading: 'What every site is built to do',
        style: 'cards',
        items: [
          { title: 'Start from the visitor', body: 'Whether they came to look closely, walk through, order, buy or commission, the site is designed around it.' },
          { title: 'Tell the story', body: 'For work that wins people over in person, the story unfolds as visitors scroll and every piece can be seen up close.' },
          { title: 'Put the facts beside the work', body: 'The answers people need to decide sit next to what they are looking at.' },
          { title: 'Make the next step easy', body: 'Ordering, booking or commissioning happens on the page.' },
          { title: 'Load quickly on a phone', body: 'Every page is built to be fast for the people who visit.' },
          { title: 'Be readable by search and AI', body: 'Pages are structured so search engines and AI assistants like ChatGPT and Gemini can read what the business does.' },
        ],
      },
      APPROACH,
    ],
    projects: ['website-journey'],
    portfolio: true,
    faq: [
      {
        q: 'Who are these websites for?',
        a: 'Any business whose website has a job to do. It especially suits makers, artisans, artists and brands whose work needs to be seen before someone buys.',
      },
      {
        q: 'Can you help the website get found?',
        a: 'Yes. Every site is structured for search and AI, and our AI discoverability service adds the wider system around it, including connected booking.',
      },
    ],
    close: {
      heading: 'Treat it like a first conversation.',
      body: 'We get to know your business, and you get an honest read on what a new website would do for it.',
    },
  },
  // Not live: needs the founder details, address and founding year confirmed.
  {
    path: '/about',
    draft: true,
    name: 'About',
    title: 'About Clause & Code | Business Systems and AI, UAE',
    description:
      'Clause & Code is a business systems and AI company based in the UAE. We map how a business actually runs, then build the systems and agents around it.',
    summary: 'Who runs Clause & Code, where we are based, and how we work.',
    serviceType: 'Business process mapping, custom business systems and AI agents',
    label: 'About us',
    heading: 'From messy',
    emphasis: 'to efficient.',
    intro: [
      'Clause & Code is a business systems and AI company based in [TO CONFIRM: Sharjah, UAE (SRTIP)]. We map how a business actually runs, then build the SOPs, custom systems, workflow automation and AI agents that let it scale without backend chaos.',
      '[TO CONFIRM: why the company was started, in the founder’s own words.]',
    ],
    sections: [
      {
        heading: 'Who we are',
        style: 'cards',
        items: [{ title: '[TO CONFIRM: founder name]', body: '[TO CONFIRM: role, background and LinkedIn profile.]' }],
      },
      APPROACH,
    ],
    projects: [],
    faq: [],
    close: {
      heading: 'Talk to us.',
      body: 'Tell us how things run today, and you will leave knowing what we would fix first.',
    },
  },
]

/** what this build shows: drafts appear on the local preview only */
export const SERVICES: Service[] = ALL.filter((service) => !service.draft || import.meta.env.DEV)

export const serviceByPath = (path: string) => SERVICES.find((service) => service.path === path)
