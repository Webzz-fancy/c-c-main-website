import type { Glyph } from '../components/complex/AgentLab'
import { site } from '../config/site'

/**
 * The home page, read top to bottom as one story: what we take off your
 * plate, one ordinary day before and after, the ways we put AI to work, the
 * work itself, how we get there, and the fix plan for anyone not sure where
 * to start. The crawler copy in static.ts reads from here too.
 */

export const HOME_HERO = {
  first: 'You run the business.',
  emphasis: 'We’ll handle the mess.',
  intro:
    'Messages that wait, follow-ups that slip, reports done late at night. We build the AI agents and systems that take that work off your plate, around how your business actually runs.',
  primary: { label: 'Book a consultation', href: site.links.booking },
  secondary: { label: 'See what we’ve built', href: '/projects' },
}

export type DayMoment = { time: string; today: string; after: string; who: string; glyph: Glyph }

export const HOME_DAY = {
  label: 'A day in your business',
  heading: 'Same day.',
  emphasis: 'Way less mess.',
  intro: 'One ordinary day, twice. Flip the switch and watch what changes.',
  off: 'Today',
  on: 'With Clause & Code',
  moments: [
    {
      time: '08:00',
      today: 'Last night’s messages are still waiting, and someone starts the day typing apologies.',
      after: 'The reply agent answered them overnight, and the people ready to book are already on your calendar.',
      who: 'Reply agent',
      glyph: 'chat',
    },
    {
      time: '10:30',
      today: 'A promising lead has gone quiet. Nobody is sure who was meant to follow up.',
      after: 'The follow-up agent drafted a personal note. You tapped yes. Sent.',
      who: 'Follow-up agent',
      glyph: 'mail',
    },
    {
      time: '13:00',
      today: 'A client asks where things stand. Three people check three spreadsheets.',
      after: 'One system shows the status, and it already told the next person it was their turn.',
      who: 'Your system',
      glyph: 'list',
    },
    {
      time: '16:00',
      today: 'Someone asks ChatGPT who to call for what you do. Your name doesn’t come up.',
      after: 'ChatGPT and Gemini can find you and recommend you, and your assistant books the call.',
      who: 'AI discoverability',
      glyph: 'eyes',
    },
    {
      time: '18:30',
      today: 'You stay late pulling the numbers together by hand.',
      after: 'The daily report is waiting: what came in, what slipped, and what needs you.',
      who: 'Report agent',
      glyph: 'chart',
    },
  ] satisfies DayMoment[],
  note: 'Every agent and system is built around your business, and anything important waits for your yes.',
}

/** one line on an ability's screen: who says it, and whether it is done,
 *  waiting for your yes, or someone asking */
export type ScreenLine = { from: string; text: string; tone: 'done' | 'ask' | 'asked' | 'note' }
/** stands in for the reader's own business name on a screen line */
export const YOU_TOKEN = '{you}'
export type Ability = {
  tab: string
  title: string
  body: string
  action: string
  href: string
  external?: boolean
  glyph: Glyph
  screen: { title: string; lines: ScreenLine[] }
}

export const HOME_ABILITIES = {
  label: 'What we can do for you',
  heading: 'AI that shows up',
  emphasis: 'where the work is.',
  intro: 'Four ways we put AI to work in your business. Pick one and see what it actually does.',
  yes: 'Yes, send',
  you: 'Your business',
  items: [
    {
      tab: 'An AI team',
      title: 'An AI team that works for you',
      body: 'An agent for each job, working as one team that reports to you, customised to how you run things.',
      action: 'Meet the agents',
      href: '/projects#agents',
      glyph: 'chat',
      screen: {
        title: 'Your agents, this morning',
        lines: [
          { from: 'Reply agent', text: 'Answered last night’s messages. Two calls booked for Thursday.', tone: 'done' },
          { from: 'Report agent', text: 'Today’s report is ready: what came in, what slipped, what needs you.', tone: 'done' },
          { from: 'Follow-up agent', text: 'Wrote a note to the lead who went quiet. Send it?', tone: 'ask' },
        ],
      },
    },
    {
      tab: 'AI discoverability',
      title: 'AI discoverability: get recommended',
      body: 'When people ask ChatGPT, Gemini or Google who to call, your business is there, and your own assistant books them in.',
      action: 'See AI discoverability',
      href: 'https://ai.clauseandcode.com/',
      external: true,
      glyph: 'eyes',
      screen: {
        title: 'Someone asks an AI assistant',
        lines: [
          { from: 'A new customer', text: 'Who should I call for what you do, near me?', tone: 'asked' },
          { from: 'AI assistant', text: 'One good option is {you}. They reply quickly, and you can book a call through their assistant.', tone: 'note' },
          { from: 'Your assistant on WhatsApp', text: 'Hi! Would Thursday at 11 or Friday at 3 work for a call?', tone: 'done' },
        ],
      },
    },
    {
      tab: 'Custom systems',
      title: 'Systems that run the routine',
      body: 'One place for the work, where every handoff moves itself along, reminders go out on time and the numbers add up.',
      action: 'See the systems',
      href: '/projects#complex-index',
      glyph: 'list',
      screen: {
        title: 'One job, moving by itself',
        lines: [
          { from: 'New enquiry', text: 'Logged, and the quote went out the same hour.', tone: 'done' },
          { from: 'Quote approved', text: 'Handed to the team, with the checklist attached.', tone: 'done' },
          { from: 'Invoice', text: 'A reminder goes out on Friday if it is still unpaid.', tone: 'note' },
        ],
      },
    },
    {
      tab: 'In-person, online',
      title: 'Your in-person experience, online',
      body: 'For work that wins people over in person: the same feeling online, with ordering or booking right on the page.',
      action: 'See the experience',
      href: '/projects#project-website-journey',
      glyph: 'heart',
      screen: {
        title: 'A visitor on your website',
        lines: [
          { from: 'As they scroll', text: 'Your story unfolds, the way you would tell it across the table.', tone: 'note' },
          { from: 'Up close', text: 'Every piece in detail, with the facts right beside it.', tone: 'note' },
          { from: 'Ready', text: 'They order, book or ask, without leaving the page.', tone: 'done' },
        ],
      },
    },
  ] satisfies Ability[],
}

export const HOME_WORK = {
  label: 'Work we’ve built',
  heading: 'Have a look',
  emphasis: 'around.',
  intro: 'AI agents, custom systems and websites, each one shown as how the work ran before and what runs now.',
  kinds: ['AI agents', 'AI discoverability', 'Custom systems', 'Client experience'],
  action: 'See our work',
  href: '/projects',
}

export const HOME_APPROACH = {
  label: 'How we work',
  heading: 'Map it first.',
  emphasis: 'Then build.',
  intro: 'Whether it’s one agent or a whole system, it goes the same way.',
  steps: [
    {
      title: 'We map how it really runs',
      body: 'We sit with you and your team and trace how the work actually moves: who does what, where it waits, and where it gets lost. Everything we build comes from this map.',
    },
    {
      title: 'We build it around you',
      body: 'Agents, systems, automations and pages shaped to your business, never squeezed into a template.',
    },
    {
      title: 'We hand it over properly',
      body: 'We set it up with your team, train them and write it all down, so it actually gets used.',
    },
    {
      title: 'We keep it working',
      body: 'We stay on to tune the agents and systems as your business changes, and add more where they would save real time.',
    },
  ],
}
