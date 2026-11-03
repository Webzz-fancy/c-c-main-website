import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { COMPLEX } from '../../content/complex'
import { BookButton } from './cta'
import './lab.css'

/**
 * The AI agents section: a floor that explains itself. A visitor picks their
 * kind of business and opens any desk to see what that agent produces. Every
 * agent is our robot, with its job on its screen. What waits goes to the right
 * person on the team, who can approve it. The last desk is theirs: any job can
 * have an agent.
 */

type Status = 'done' | 'yes' | 'drafted' | 'due'
// What each agent hands back, drawn as the thing itself: a chat, an email, a
// week of posts, a report. All samples: no client work, no results claimed.
type Sample =
  | { kind: 'chat'; title: string; lines: string[]; result?: { day: string; time: string; title: string; detail: string } }
  | { kind: 'email'; title: string; to: string; subject: string; body: string; notes?: string[] }
  | { kind: 'posts'; title: string; posts: { when: string; text: string; ready: boolean }[]; foot: string }
  | { kind: 'report'; title: string; rows: { label: string; value: string; bar: number }[]; foot: string }
  | { kind: 'tasks'; title: string; rows: { text: string; status: Status; when?: string }[] }
  | { kind: 'agents'; title: string; agents: { name: string; job: string }[] }
type Desk = { name: string; job: string; own: string; waits: string; sample?: Sample }

const DESKS: Record<string, Partial<Record<string, Omit<Desk, 'name' | 'job'>>>> = {
  any: {
    'Front desk': {
      own: 'Answers, qualifies and books calls',
      waits: 'Anything that commits you',
      sample: { kind: 'chat', title: 'Website chat · 11:52pm', lines: ['them:Do you have time this week to talk about a project?', 'us:Yes. Thursday at 3pm or Friday at 10am are free. Which suits you?', 'them:Friday please.', 'us:Booked. You’ll get a confirmation and a reminder.'], result: { day: 'Fri', time: '10:00', title: 'Call booked', detail: 'In your calendar, reminder set' } },
    },
    Sales: {
      own: 'Researches each lead and drafts the follow up',
      waits: 'Sending it',
      sample: {
        kind: 'email',
        title: 'Follow up, drafted',
        notes: ['12-person agency, hiring', 'Asked about enquiries after hours'],
        to: 'Sam, new lead',
        subject: 'Your after-hours enquiries',
        body: 'Thanks for the call on Tuesday. You said enquiries go unanswered after 6pm. Here is how an agent would handle them, and what it takes to set up…',
      },
    },
    Operations: {
      own: 'Tracks orders, invoices and deadlines',
      waits: 'Payments and anything sent out',
      sample: { kind: 'tasks', title: 'Today', rows: [{ text: 'This week’s invoices sent', status: 'done' }, { text: 'Payment reminder to an overdue client', status: 'yes' }, { text: 'Supplier delivery confirmed', status: 'done', when: 'Tue' }, { text: 'Contract renewal', status: 'due', when: '14 days' }] },
    },
    Reports: {
      own: 'Collects the numbers and writes the report',
      waits: 'Nothing. It only reports',
      sample: { kind: 'report', title: 'Daily report · Tuesday', rows: [{ label: 'Enquiries answered', value: '14', bar: 0.78 }, { label: 'Calls booked', value: '5', bar: 0.36 }, { label: 'Follow ups sent', value: '9', bar: 0.56 }], foot: 'Slipped: two follow ups are a day late' },
    },
    Content: {
      own: 'Plans and writes posts, and answers comments',
      waits: 'Publishing',
      sample: {
        kind: 'posts',
        title: 'Next week, ready to go',
        posts: [
          { when: 'Mon · 9:00', text: 'Outgrown your spreadsheets?', ready: true },
          { when: 'Wed · 12:30', text: 'A client’s first week with us', ready: true },
          { when: 'Fri · 17:00', text: 'Your question, answered', ready: false },
        ],
        foot: 'Checked for tone and facts · 4 comments answered',
      },
    },
  },
  law: {
    Intake: {
      own: 'Asks your intake questions and runs a conflict check',
      waits: 'Taking on the matter',
      sample: { kind: 'chat', title: 'New enquiry · 11:40pm', lines: ['them:I need help with a lease dispute.', 'us:I can book you a consultation with one of our lawyers. A few quick questions first, so they are ready for you.', 'us:Conflict check: clear.'], result: { day: 'Tue', time: '9:30', title: 'Consultation held', detail: 'Until a lawyer accepts the matter' } },
    },
    Documents: {
      own: 'Drafts letters from your templates',
      waits: 'A lawyer reviews every one',
      sample: { kind: 'email', title: 'Engagement letter, drafted', notes: ['From your template', 'Matches the intake answers'], to: 'Ms Rahman, new client', subject: 'Engagement letter: lease dispute', body: 'Thank you for instructing us on your lease dispute. This letter sets out the scope of our work, who will handle it and our fees…' },
    },
    Deadlines: {
      own: 'Pulls dates from every matter',
      waits: 'A lawyer confirms each date',
      sample: { kind: 'tasks', title: 'This week', rows: [{ text: 'Filing due: lease dispute', status: 'due', when: 'Fri' }, { text: 'Hearing date to confirm', status: 'yes', when: 'Mon' }, { text: 'Limitation date to confirm', status: 'yes', when: 'Thu' }] },
    },
    Billing: {
      own: 'Turns time logs into invoice drafts',
      waits: 'Sending any invoice',
      sample: { kind: 'tasks', title: 'Billing', rows: [{ text: 'Time logged on 6 matters', status: 'done' }, { text: 'Invoice drafts for review', status: 'yes' }, { text: 'Breakdown one client asked for', status: 'drafted' }] },
    },
  },
  clinic: {
    'Front desk': {
      own: 'Books, confirms and moves visits',
      waits: 'Anything medical goes to your staff',
      sample: { kind: 'chat', title: 'WhatsApp · 10:04pm', lines: ['them:Can I move my Thursday appointment?', 'us:Of course. Friday at 10am or Monday at 2pm?', 'them:Monday.', 'us:Done. See you Monday at 2pm.'], result: { day: 'Mon', time: '14:00', title: 'Visit moved', detail: 'Calendar updated, Thursday freed' } },
    },
    Recalls: {
      own: 'Finds patients due a visit and drafts a message',
      waits: 'Your front desk approves them',
      sample: { kind: 'email', title: 'Recall message, drafted', notes: ['Last visit: 6 months ago', 'Prefers WhatsApp'], to: 'Aisha, patient', subject: 'Time for your check up', body: 'It has been six months since your last check up. Would you like us to book you in? Reply with a day that suits you.' },
    },
    Supplies: {
      own: 'Watches stock and drafts reorders',
      waits: 'Placing the order',
      sample: { kind: 'report', title: 'Stock watch', rows: [{ label: 'Gloves', value: '9 days left', bar: 0.18 }, { label: 'Masks', value: '30 days left', bar: 0.7 }, { label: 'Syringes', value: '21 days left', bar: 0.5 }], foot: 'Reorder for gloves drafted, waiting for your yes' },
    },
    Aftercare: {
      own: 'Sends care messages and asks for reviews',
      waits: 'Staff check every care message',
      sample: { kind: 'tasks', title: 'After today’s visits', rows: [{ text: 'Care messages for 8 patients', status: 'yes' }, { text: 'Review requests', status: 'drafted', when: 'Tomorrow' }, { text: 'Yesterday’s follow ups', status: 'done' }] },
    },
  },
  accounting: {
    Documents: {
      own: 'Chases and files every client’s papers',
      waits: 'Reminders to clients',
      sample: { kind: 'tasks', title: 'Client papers', rows: [{ text: 'Bank statements filed for 12 clients', status: 'done' }, { text: 'Reminder to 2 clients missing receipts', status: 'yes' }, { text: 'Payroll papers', status: 'due', when: 'Fri' }] },
    },
    Deadlines: {
      own: 'Tracks every filing and tax date',
      waits: 'A partner confirms each date',
      sample: { kind: 'tasks', title: 'This month', rows: [{ text: 'Tax returns for 6 clients', status: 'due', when: '7 days' }, { text: 'Year end date to confirm', status: 'yes' }, { text: 'Payroll filing', status: 'drafted', when: 'Mon' }, { text: 'Last month’s filings', status: 'done' }] },
    },
    Summaries: {
      own: 'Drafts a monthly summary for each client',
      waits: 'A partner reviews each one',
      sample: { kind: 'email', title: 'Monthly summary, drafted', notes: ['Pulled from the books', 'Costs up on last month'], to: 'Omar, client', subject: 'Your March summary', body: 'Here is how March went: what came in, what went out, and what changed from February. Two items need your attention before the next return…' },
    },
    Onboarding: {
      own: 'Walks each new client through every step',
      waits: 'Signing a client off as ready',
      sample: { kind: 'tasks', title: 'New client, step by step', rows: [{ text: 'Engagement letter signed', status: 'done' }, { text: 'ID checked', status: 'done' }, { text: 'Access to the books requested', status: 'drafted' }, { text: 'Welcome call to confirm', status: 'yes' }] },
    },
  },
  property: {
    Enquiries: {
      own: 'Replies, qualifies and books viewings',
      waits: 'Offers and anything legal',
      sample: { kind: 'chat', title: 'WhatsApp · 9:48pm', lines: ['them:Is the 2 bed by the park still available?', 'us:It is. Are you looking to rent or buy, and when would you like to move?', 'them:Rent, from next month.', 'us:Saturday at 11am or Monday at 6pm for a viewing?'], result: { day: 'Sat', time: '11:00', title: 'Viewing booked', detail: 'Renting, moving next month' } },
    },
    Viewings: {
      own: 'Books viewings and follows up after',
      waits: 'Sending each follow up',
      sample: { kind: 'email', title: 'Follow up, drafted', notes: ['Viewed on Saturday', 'Asked about parking'], to: 'Leila, viewed the 2 bed', subject: 'Thanks for coming on Saturday', body: 'Thanks for viewing the flat on Saturday. You asked about parking: one space comes with the flat. Would you like to make an offer, or see it again…' },
    },
    Paperwork: {
      own: 'Chases the documents for every deal',
      waits: 'Sending any contract',
      sample: { kind: 'tasks', title: 'One deal', rows: [{ text: 'ID and proof of funds', status: 'done' }, { text: 'Chase for the mortgage offer', status: 'drafted' }, { text: 'Contract ready to send', status: 'yes' }, { text: 'Completion', status: 'due', when: '3 weeks' }] },
    },
    Listings: {
      own: 'Writes listings from your notes and photos',
      waits: 'Every listing before it goes public',
      sample: {
        kind: 'posts',
        title: 'Listings, drafted',
        posts: [
          { when: 'Mon · 10:00', text: 'Bright 2 bed by the park', ready: true },
          { when: 'Wed · 10:00', text: 'Family home with a garden', ready: true },
          { when: 'Fri · 10:00', text: 'Studio by the station', ready: false },
        ],
        foot: 'Facts checked against your notes',
      },
    },
  },
  agency: {
    Sales: {
      own: 'Researches leads and drafts outreach',
      waits: 'Sending it',
      sample: { kind: 'email', title: 'Outreach, drafted', notes: ['Opened a second office', 'Hiring two designers'], to: 'Priya, studio owner', subject: 'Congrats on the new office', body: 'Saw you opened a second office this month. Growing teams often hit the same wall with client onboarding, so here is how we would take that off your plate…' },
    },
    Proposals: {
      own: 'Turns call notes into a proposal',
      waits: 'You review and send it',
      sample: { kind: 'email', title: 'Proposal, drafted from the call', notes: ['Budget from the call', 'Wants to start in May'], to: 'Daniel, prospect', subject: 'Proposal: website and booking', body: 'Thanks for the call. You need the site live before May and every booking in one place. Here is the scope, the timeline and the price…' },
    },
    Projects: {
      own: 'Tracks every project and flags overruns',
      waits: 'What you tell the client',
      sample: { kind: 'tasks', title: 'Projects this week', rows: [{ text: 'Website rebuild on track', status: 'done' }, { text: 'App design 10% over its hours', status: 'yes' }, { text: 'Client feedback on the brand', status: 'due', when: 'Thu' }] },
    },
    Reports: {
      own: 'Writes each monthly client report',
      waits: 'You review it before it goes',
      sample: { kind: 'report', title: 'Monthly client report', rows: [{ label: 'Site visits', value: '2,140', bar: 0.72 }, { label: 'Enquiries', value: '38', bar: 0.5 }, { label: 'Calls booked', value: '11', bar: 0.34 }], foot: 'Drafted for each client, waiting for your review' },
    },
  },
  academy: {
    Admissions: {
      own: 'Answers enquiries and enrols students',
      waits: 'Confirming a place',
      sample: { kind: 'chat', title: 'Website chat · 8:15pm', lines: ['them:Do you have places in the Saturday class for a 9 year old?', 'us:Yes, two places left. Would you like a free trial lesson first?', 'them:Yes please.', 'us:Booked for Saturday at 10am. The details are on their way.'], result: { day: 'Sat', time: '10:00', title: 'Trial booked', detail: 'Enrolment form sent after' } },
    },
    Attendance: {
      own: 'Keeps the registers and tracks progress',
      waits: 'Messages to families',
      sample: { kind: 'report', title: 'This week', rows: [{ label: 'Attendance', value: '94%', bar: 0.94 }, { label: 'Homework in', value: '81%', bar: 0.81 }, { label: 'Missed two classes', value: '3 students', bar: 0.15 }], foot: 'Notes to 3 families drafted, waiting for your yes' },
    },
    Fees: {
      own: 'Sends fee reminders and tracks who has paid',
      waits: 'Every reminder before it goes',
      sample: { kind: 'email', title: 'Fee reminder, drafted', notes: ['Term fee due 5 days ago', 'Usually pays on time'], to: 'Adam’s parents', subject: 'A reminder: spring term fee', body: 'Just a reminder that the spring term fee was due last week. You can pay by transfer or card with the link below. If you have already paid, thank you…' },
    },
    Timetable: {
      own: 'Finds cover and keeps the term plan',
      waits: 'Approving any change',
      sample: { kind: 'tasks', title: 'Next week', rows: [{ text: 'Term plan published', status: 'done' }, { text: 'Cover for Tuesday’s maths', status: 'yes', when: 'Tue' }, { text: 'Room swap on Thursday', status: 'drafted' }, { text: 'Parents’ evening', status: 'due', when: '2 weeks' }] },
    },
  },
  store: {
    Support: {
      own: 'Answers order and delivery questions',
      waits: 'Refunds and complaints',
      sample: { kind: 'chat', title: 'WhatsApp · 11:20pm', lines: ['them:Where is my order? I ordered on Monday.', 'us:It left our warehouse yesterday and arrives tomorrow before 1pm. Here is the tracking link.', 'them:Perfect, thanks.'], result: { day: 'Thu', time: '13:00', title: 'Customer updated', detail: 'Tracking link sent' } },
    },
    Orders: {
      own: 'Confirms orders and sends invoices',
      waits: 'Anything with money at risk',
      sample: { kind: 'tasks', title: 'Today', rows: [{ text: '24 orders confirmed', status: 'done' }, { text: 'Invoices sent', status: 'done' }, { text: 'Payment failed on 2 orders', status: 'yes' }, { text: 'Trade order to pack', status: 'due', when: 'Today' }] },
    },
    Stock: {
      own: 'Watches stock and drafts reorders',
      waits: 'Placing any order',
      sample: { kind: 'report', title: 'Stock watch', rows: [{ label: 'Best seller', value: '6 days left', bar: 0.15 }, { label: 'Gift boxes', value: '25 days left', bar: 0.6 }, { label: 'Spring range', value: '40 days left', bar: 0.85 }], foot: 'Reorder for the best seller drafted, waiting for your yes' },
    },
    Suppliers: {
      own: 'Follows up on every delivery',
      waits: 'Sending it',
      sample: { kind: 'email', title: 'Supplier follow up, drafted', notes: ['Delivery 3 days late', 'Second delay this month'], to: 'Packaging supplier', subject: 'Delivery due on the 12th', body: 'Our packaging delivery was due on the 12th and has not arrived. Can you confirm a new date today? We have orders waiting to ship…' },
    },
  },
  trades: {
    Bookings: {
      own: 'Answers job enquiries and books visits',
      waits: 'Emergencies go to a person',
      sample: { kind: 'chat', title: 'Website chat · 9:05pm', lines: ['them:My boiler stopped working. Can someone come this week?', 'us:Sorry to hear that. Is any water leaking?', 'them:No leak.', 'us:We can come Wednesday between 8 and 10am. Shall I book it?'], result: { day: 'Wed', time: '8:00', title: 'Visit booked', detail: 'Job details sent to the engineer' } },
    },
    Quotes: {
      own: 'Drafts quotes from your price list',
      waits: 'You check the price and send',
      sample: { kind: 'email', title: 'Quote, drafted', notes: ['From your price list', 'Photos from the customer'], to: 'Mr Patel, kitchen job', subject: 'Your quote: tap and pipework', body: 'Thanks for the photos. Based on what you sent, here is our quote to replace the tap and the pipework under the sink, parts and labour included…' },
    },
    Scheduling: {
      own: 'Plans the team’s days and routes',
      waits: 'Moving a booked job',
      sample: { kind: 'tasks', title: 'Tomorrow', rows: [{ text: 'Routes planned for 3 vans', status: 'done' }, { text: 'Customer reminders sent', status: 'done' }, { text: 'Move one job to Friday', status: 'yes' }, { text: 'Parts to collect', status: 'due', when: '8am' }] },
    },
    Invoices: {
      own: 'Sends invoices and payment reminders',
      waits: 'Each reminder before it goes',
      sample: { kind: 'report', title: 'Invoices this week', rows: [{ label: 'Sent', value: '18', bar: 0.8 }, { label: 'Paid', value: '14', bar: 0.64 }, { label: 'Overdue', value: '2', bar: 0.1 }], foot: 'Reminders for 2 overdue invoices drafted' },
    },
  },
}

// The last desk on every floor: the desks shown are examples, and any other
// job can have an agent of its own.
const ADD: Desk = {
  name: 'Add an agent',
  job: 'Hiring, research, stock: any job you want off your plate',
  own: 'The job you describe, built around your tools and rules',
  waits: 'Anything that matters, the same as every other agent',
  sample: {
    kind: 'agents',
    title: 'Agents we can build',
    agents: [
      { name: 'Hiring', job: 'Screens CVs, books interviews' },
      { name: 'Research', job: 'Tracks competitors and prices' },
      { name: 'Social inbox', job: 'Answers DMs and comments' },
      { name: 'Reviews', job: 'Asks happy clients for one' },
      { name: 'Stock', job: 'Warns before you run out' },
      { name: 'Yours', job: 'Describe the job' },
    ],
  },
}

// Who each waiting item goes to, in queue order: approvals reach the right
// person on the team, not only the owner.
const TEAM: Record<string, string[]> = {
  any: ['You', 'Finance', 'Marketing'],
  law: ['Partner', 'Associate', 'Associate'],
  clinic: ['Reception', 'Manager', 'Manager'],
  accounting: ['Partner', 'Associate', 'Associate'],
  property: ['You', 'Sales', 'Lettings'],
  agency: ['You', 'Sales', 'Account lead'],
  academy: ['Office', 'Head', 'Head'],
  store: ['You', 'Sales', 'You'],
  trades: ['You', 'Dispatch', 'Finance'],
}

// What starts each agent's work, by what it hands back
const FROM: Record<Sample['kind'] | 'none', string> = {
  chat: 'A message, at any hour',
  email: 'A new lead or record',
  tasks: 'What is due in your tools',
  report: 'The numbers in your tools',
  posts: 'Your plan and your brand',
  agents: 'A job you describe',
  none: 'Your tools and inbox',
}

// Every agent is our robot; what is on its screen says what it does.
type Glyph = 'eyes' | 'chat' | 'mail' | 'calendar' | 'list' | 'pen' | 'chart' | 'box' | 'coin' | 'heart' | 'plus'
const GLYPHS: Record<Glyph, string> = {
  eyes: 'M6.5 11q2.5-3.5 5 0M12.5 11q2.5-3.5 5 0M9 15.5q3 2.2 6 0',
  chat: 'M5 6.5h14v9h-8l-4 3v-3H5z',
  mail: 'M4.5 7h15v10h-15zM4.5 7.5l7.5 5.5 7.5-5.5',
  calendar: 'M5 7h14v12H5zM5 11h14M9 5v4M15 5v4',
  list: 'M10 7.5h9M10 12h9M10 16.5h9M5.5 7.5h1M5.5 12h1M5.5 16.5h1',
  pen: 'M5.5 18.5l3.5-1 9.5-9.5-2.5-2.5-9.5 9.5zM14.5 7.5l2.5 2.5',
  chart: 'M6 18.5v-5M10 18.5V9M14 18.5v-7M18 18.5V6',
  box: 'M4.5 8.5L12 5l7.5 3.5v7.5L12 19.5 4.5 16zM4.5 8.5L12 12l7.5-3.5M12 12v7.5',
  coin: 'M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM14.5 9.5h-3.2a1.6 1.6 0 0 0 0 3.2h1.4a1.6 1.6 0 0 1 0 3.2H9.5M12 8v1.5M12 15.9v1.6',
  heart: 'M12 18.5s-6.5-4-6.5-8.6A3.4 3.4 0 0 1 12 8a3.4 3.4 0 0 1 6.5 1.9c0 4.6-6.5 8.6-6.5 8.6z',
  plus: 'M12 6v12M6 12h12',
}
const GLYPH_OF: [Glyph, RegExp][] = [
  ['chat', /front desk|intake|enquir|support|admission|booking|social/i],
  ['mail', /sales|recall|proposal|hiring/i],
  ['calendar', /deadline|schedul|timetable|viewing|attendance/i],
  ['pen', /content|listing|document/i],
  ['chart', /report|summar|research/i],
  ['box', /suppl|stock/i],
  ['coin', /billing|fee|invoice|quote/i],
  ['heart', /aftercare|review/i],
  ['plus', /add an agent|yours/i],
]
const glyphOf = (name: string): Glyph => GLYPH_OF.find(([, re]) => re.test(name))?.[0] ?? 'list'

// The agents' card on the projects slider: a director over a row of agents.
export function AgentsVisual() {
  return (
    <span className="lab-team" aria-hidden="true">
      <Bot glyph="eyes" size="md" />
      <span>
        {(['chat', 'mail', 'pen', 'chart'] as Glyph[]).map((g) => <Bot key={g} glyph={g} size="md" />)}
      </span>
    </span>
  )
}

function Bot({ glyph, size = 'sm' }: { glyph: Glyph; size?: 'sm' | 'md' }) {
  return (
    <span className={`lab-bot lab-bot--${size}`} data-glyph={glyph} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d={GLYPHS[glyph]} /></svg>
    </span>
  )
}

// The kind of business is shared with the hero's finder: naming one there sets it here.
export default function AgentLab({ industry, onIndustry }: { industry: string; onIndustry: (id: string) => void }) {
  const { agents } = COMPLEX
  const picked = agents.industries.items.find((i) => i.id === industry)
  const deskData = DESKS[industry] ?? {}
  const desks: Desk[] = (picked ? picked.teams : agents.teams).map((t): Desk => ({
    name: t.name,
    job: t.job.replace(/ · /g, ', '),
    own: deskData[t.name]?.own ?? t.job.replace(/ · /g, ', '),
    waits: deskData[t.name]?.waits ?? 'Anything sent out',
    sample: deskData[t.name]?.sample,
  })).concat(ADD)
  const queue = picked ? picked.queue : agents.queue.items
  const team = TEAM[industry] ?? TEAM.any

  // the desk a visitor has opened
  const [open, setOpen] = useState<number | null>(null)
  const [approved, setApproved] = useState<Record<number, boolean>>({})

  // a new kind of business, picked here or named in the finder: a fresh office
  useEffect(() => {
    setOpen(null)
    setApproved({})
  }, [industry])


  // The wires between desks, measured from where the desks really are, so work
  // can be seen travelling: out from the director, and back down to you.
  const floorRef = useRef<HTMLDivElement>(null)
  const [wires, setWires] = useState<{ d: string; back: boolean; live: boolean }[]>([])
  const measure = useCallback(() => {
    const floor = floorRef.current
    if (!floor) return
    const f = floor.getBoundingClientRect()
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.left - f.left + r.width / 2, top: r.top - f.top, bottom: r.bottom - f.top }
    }
    const dir = floor.querySelector('[data-spot="director"]')
    const queueEl = floor.querySelector('[data-spot="queue"]')
    const deskEls = Array.from(floor.querySelectorAll('.lab-desk'))
    if (!dir || !queueEl || !deskEls.length) return
    const d = box(dir)
    const q = box(queueEl)
    const bus = (d.bottom + box(deskEls[0]).top) / 2
    setWires(deskEls.flatMap((el, i) => {
      const k = box(el)
      const last = i === deskEls.length - 1
      return [
        { d: `M${d.x} ${d.bottom} V${bus} H${k.x} V${k.top}`, back: false, live: !last },
        ...(last ? [] : [{ d: `M${k.x} ${k.bottom} V${q.top}`, back: true, live: i % 2 === 1 }]),
      ]
    }))
  }, [])
  useLayoutEffect(() => { measure() }, [measure, industry])
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // until a visitor opens a desk, the first one breathes
  const [touched, setTouched] = useState(false)
  const toggle = (i: number) => {
    setTouched(true)
    setOpen(open === i ? null : i)
  }

  // the card sits under its desk, kept inside the row
  const desksRef = useRef<HTMLDivElement>(null)
  const [card, setCard] = useState({ left: 0, arrow: 0, width: 0 })
  useLayoutEffect(() => {
    const row = desksRef.current
    const desk = open === null ? null : row?.querySelectorAll('.lab-desk')[open]
    if (!row || !desk) return
    const r = row.getBoundingClientRect()
    const d = desk.getBoundingClientRect()
    const width = Math.min(820, r.width)
    const centre = d.left - r.left + d.width / 2
    const left = Math.max(0, Math.min(centre - width / 2, r.width - width))
    setCard({ left, arrow: centre - left, width })
  }, [open, industry])

  // an opened card that runs past the bottom of the screen is brought into view
  useEffect(() => {
    if (open === null) return
    const frame = requestAnimationFrame(() => {
      const r = document.getElementById('lab-card')?.getBoundingClientRect()
      if (r && r.bottom > window.innerHeight - 16) window.scrollBy({ top: r.bottom - window.innerHeight + 24, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // an open desk closes with its ×, a click anywhere else, or Escape
  useEffect(() => {
    if (open === null) return
    const away = (e: PointerEvent) => { if (!desksRef.current?.contains(e.target as Node)) setOpen(null) }
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const n = desks.length
  const waiting = queue.filter((_, i) => !approved[i]).length
  const shown = open === null ? null : desks[open]

  return (
    <section id="agents" className="lab" aria-labelledby="lab-title">
      <div className="lab__inner">
        <header className="lab__head">
          <div>
            <p className="complex-eyebrow">02 / {agents.label}</p>
            <h2 id="lab-title">
              {agents.heading} <em>You approve.</em> <em>They do the rest.</em>
            </h2>
          </div>
          <p className="lab__intro">{agents.intro}</p>
        </header>

        <div className="lab-track">
          <div ref={floorRef} className="lab-floor" key={industry}>
            <svg className="lab-wires" aria-hidden="true">
              {wires.map((w) => <path key={w.d} className={w.back ? 'lab-wire lab-wire--back' : 'lab-wire'} d={w.d} />)}
              {wires.filter((w) => w.live).map((w, i) => (
                <circle key={`p-${w.d}`} className={w.back ? 'lab-packet lab-packet--back' : 'lab-packet'} r={3.5}>
                  <animateMotion dur={w.back ? '2.4s' : '3.4s'} begin={`${i * 0.6}s`} repeatCount="indefinite" path={w.d} />
                </circle>
              ))}
            </svg>

            <div className="lab-bar">
              <label className="lab-pick">
                <span>Agents for</span>
                <select value={industry} onChange={(e) => onIndustry(e.target.value)}>
                  <option value="any">Any business</option>
                  {agents.industries.items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
              </label>
            </div>

            <div className="lab-floor__top">
              <div className="lab-director" data-spot="director">
                <Bot glyph="eyes" size="md" />
                <b>{agents.director.name}</b>
                <span>{agents.director.job.replace(/ · /g, ', ')}</span>
              </div>
            </div>

            <div ref={desksRef} className="lab-desks" style={{ ['--n' as string]: n }}>
              {desks.map((desk, i) => (
                <Fragment key={desk.name}>
                  <button
                    type="button"
                    className={i === n - 1 ? 'lab-desk lab-desk--add' : 'lab-desk'}
                    data-open={open === i ? '' : undefined}
                    data-nudge={!touched && i === 0 ? '' : undefined}
                    aria-expanded={open === i}
                    aria-controls={open === i ? 'lab-card' : undefined}
                    onClick={() => toggle(i)}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <Bot glyph={glyphOf(desk.name)} />
                    <b>{desk.name}</b>
                    <span>{desk.job}</span>
                    {/* the corner mark says a desk opens, without saying "click" */}
                    <i className="lab-desk__more" aria-hidden="true" />
                  </button>
                  {/* the card follows its desk, so the keyboard reaches it next */}
                {open === i && shown && (
                  <div
                    id="lab-card"
                    key={`${industry}-${open}`}
                    className="lab-detail"
                    role="region"
                    aria-label={`${shown.name} agent`}
                    style={{ left: card.left, width: card.width, ['--at' as string]: `${card.arrow}px` }}
                  >
                    {/* where the work comes from, what the agent does, and where you come in */}
                    <header className="lab-detail__head">
                      <Bot glyph={glyphOf(shown.name)} size="md" />
                      <b>{shown.name}</b>
                      <ol className="lab-flow">
                        <li data-level="in"><small>Comes in</small>{FROM[shown.sample?.kind ?? 'none']}</li>
                        <li data-level="automatic"><small>Agent does</small>{shown.own}</li>
                        <li data-level="your-yes"><small>Waits for you</small>{shown.waits}</li>
                      </ol>
                      <button type="button" className="lab-detail__close" aria-label="Close" onClick={() => setOpen(null)} />
                    </header>
                    {shown.sample ? <SampleView sample={shown.sample} /> : <p className="lab-detail__none">A sample for this desk is coming.</p>}
                  </div>
                )}
                </Fragment>
              ))}
            </div>

            {/* your team, and what is waiting on each of them, in one bar */}
            <div className="lab-queue" data-spot="queue">
              <div className="lab-queue__you">
                <span className="lab-queue__team" aria-hidden="true">
                  {['You', ...new Set(team.filter((t) => t !== 'You'))].slice(0, 3).map((t) => <span key={t}>{t === 'You' ? 'You' : t[0]}</span>)}
                </span>
                <p>Waiting on your team</p>
                <b>{waiting}</b>
              </div>
              <ul>
                {queue.map((item, i) => (
                  <li key={item} data-done={approved[i] ? '' : undefined}>
                    <span>{item}<small>For {team[i] === 'You' ? 'you' : team[i]}</small></span>
                    {approved[i]
                      ? <em data-level="on-record">On record</em>
                      : <button type="button" onClick={() => setApproved({ ...approved, [i]: true })}>Approve</button>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <footer className="lab__close">
          <div className="lab__how">
            <p>{agents.setup.label}</p>
            <ol>
              {agents.setup.steps.map((st, i) => (
                <li key={st.step}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <b>{st.step}</b>
                  <small>{st.what}</small>
                </li>
              ))}
            </ol>
          </div>
          <BookButton label={agents.action} />
        </footer>
      </div>
    </section>
  )
}

// Writes a draft out the way the agent would, a few characters at a time
function useTyped(text: string, perTick = 3) {
  const [length, setLength] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setLength(text.length); return }
    setLength(0)
    const id = window.setInterval(() => setLength((l) => {
      if (l >= text.length) { window.clearInterval(id); return l }
      return l + perTick
    }), 28)
    return () => window.clearInterval(id)
  }, [text, perTick])
  return text.slice(0, length)
}

const APP: Record<Sample['kind'], string> = {
  chat: 'Messages',
  email: 'Drafts',
  posts: 'Social planner',
  report: 'Morning report',
  tasks: 'Work board',
  agents: 'New agents',
}

// Each sample is drawn as the screen it would appear on, filling in as you watch.
function SampleView({ sample }: { sample: Sample }) {
  return (
    <figure className={`lab-app lab-app--${sample.kind}`}>
      <figcaption className="lab-app__bar">
        <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        <span>{APP[sample.kind]} · {sample.title}</span>
        <em>Sample</em>
      </figcaption>
      <div className="lab-app__body">
        {sample.kind === 'chat' && <ChatSample sample={sample} />}
        {sample.kind === 'email' && <MailSample sample={sample} />}
        {sample.kind === 'posts' && <PostsSample sample={sample} />}
        {sample.kind === 'report' && <ReportSample sample={sample} />}
        {sample.kind === 'tasks' && <BoardSample sample={sample} />}
        {sample.kind === 'agents' && (
          <ul className="lab-hire">
            {sample.agents.map((a, i) => (
              <li key={a.name} data-yours={i === sample.agents.length - 1 ? '' : undefined} style={{ ['--i' as string]: i }}>
                <Bot glyph={glyphOf(a.name)} />
                <b>{a.name}</b>
                <span>{a.job}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </figure>
  )
}

function ChatSample({ sample }: { sample: Extract<Sample, { kind: 'chat' }> }) {
  return (
    <div className="lab-chat">
      <div className="lab-chat__thread">
        {sample.lines.map((line, i) => {
          const [who, ...rest] = line.split(':')
          return <p key={line} data-who={who} style={{ ['--i' as string]: i }}>{rest.join(':')}</p>
        })}
      </div>
      {sample.result && (
        <div className="lab-chat__result" style={{ ['--i' as string]: sample.lines.length }}>
          <span className="lab-date"><small>{sample.result.day}</small>{sample.result.time}</span>
          <b>✓ {sample.result.title}</b>
          <span>{sample.result.detail}</span>
        </div>
      )}
    </div>
  )
}

function MailSample({ sample }: { sample: Extract<Sample, { kind: 'email' }> }) {
  const body = useTyped(sample.body)
  const [sent, setSent] = useState(false)
  return (
    <div className="lab-mail">
      {sample.notes && (
        <div className="lab-mail__found">
          <small>What it found first</small>
          <ul>{sample.notes.map((note, i) => <li key={note} style={{ ['--i' as string]: i }}>{note}</li>)}</ul>
        </div>
      )}
      <div className="lab-mail__sheet">
        <p className="lab-mail__to"><span>To</span>{sample.to}</p>
        <p className="lab-mail__subject">{sample.subject}</p>
        <p className="lab-mail__body">{body}<i className="lab-caret" aria-hidden="true" /></p>
        <div className="lab-mail__act">
          {sent
            ? <em data-level="on-record">Sent · on record</em>
            : <>
                <button type="button" onClick={() => setSent(true)}>Approve and send</button>
                <span data-level="your-yes">Waiting for your yes</span>
              </>}
        </div>
      </div>
    </div>
  )
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function PostsSample({ sample }: { sample: Extract<Sample, { kind: 'posts' }> }) {
  const days = sample.posts.map((p) => p.when.split(' ')[0])
  return (
    <div className="lab-plan">
      <div className="lab-posts">
        {sample.posts.map((post, i) => (
          <div key={post.text} className="lab-post" style={{ ['--i' as string]: i }}>
            <div className="lab-post__art" data-tone={i}>
              <span>@yourbrand</span>
              <p>{post.text}</p>
            </div>
            <small data-ready={post.ready ? '' : undefined}>{post.ready ? `✓ Scheduled · ${post.when}` : `Needs your yes · ${post.when}`}</small>
          </div>
        ))}
      </div>
      <div className="lab-plan__foot">
        <ol className="lab-week" aria-label="This week">
          {WEEK.map((d) => <li key={d} data-on={days.includes(d) ? '' : undefined}>{d[0]}</li>)}
        </ol>
        <p className="lab-app__foot">{sample.foot}</p>
      </div>
    </div>
  )
}

// a little week of history behind each number, drawn from the number itself
const spark = (bar: number) => [0.5, 0.7, 0.45, 0.8, 0.6, 0.9, 1].map((k, i) => Math.max(0.12, Math.min(1, bar * k + (i % 2 ? 0.08 : 0))))
function ReportSample({ sample }: { sample: Extract<Sample, { kind: 'report' }> }) {
  return (
    <div className="lab-report">
      <dl>
        {sample.rows.map((row, i) => (
          <div key={row.label} style={{ ['--i' as string]: i }} data-low={row.bar < 0.25 ? '' : undefined}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <dd className="lab-spark" aria-hidden="true">
              {spark(row.bar).map((h, j) => <span key={j} style={{ height: `${h * 100}%`, ['--j' as string]: j }} />)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="lab-app__foot" data-level="your-yes">{sample.foot}</p>
    </div>
  )
}

const COLUMNS: { status: Status; label: string }[] = [
  { status: 'done', label: 'Done' },
  { status: 'drafted', label: 'Drafted' },
  { status: 'yes', label: 'Your yes' },
  { status: 'due', label: 'Coming up' },
]
function BoardSample({ sample }: { sample: Extract<Sample, { kind: 'tasks' }> }) {
  const columns = COLUMNS.filter((c) => sample.rows.some((r) => r.status === c.status))
  let k = 0
  return (
    <div className="lab-board" style={{ ['--cols' as string]: columns.length }}>
      {columns.map((c) => (
        <div key={c.status} data-status={c.status}>
          <small>{c.label}</small>
          {sample.rows.filter((r) => r.status === c.status).map((r) => (
            <p key={r.text} style={{ ['--i' as string]: k++ }}>
              {r.text}
              {r.when && <span>{r.when}</span>}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}
