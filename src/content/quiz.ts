/**
 * The business fix plan: a short check of how work actually moves through a
 * business, from being found to getting paid and what happens after.
 *
 * The visitor tells us what kind of business they run, how big the team is
 * and what they think the problem is. Then nine questions about what really
 * happens, each with an honest "not sure", and one question that checks the
 * weakest point against their own records. The plan names the first thing
 * worth fixing, shows the answers behind it, says how it connects to the rest,
 * gives them a check to run themselves, and the simplest fix before any
 * system. It also says what the answers could not tell.
 *
 * Scores stay in here and are never shown. Everything the plan says is built
 * from the answers. A visitor can also describe their
 * business when none of the listed types fit; that detail does not affect scoring.
 */

import { site } from '../config/site'

/** the words a kind of business uses for the people it serves and the work */
export type Nouns = { person: string; people: string; work: string; works: string }

export const MODELS: { id: string; label: string; hint: string; nouns: Nouns }[] = [
  { id: 'services', label: 'Professional services', hint: 'Legal, accounting, consulting, agencies', nouns: { person: 'client', people: 'clients', work: 'project', works: 'projects' } },
  { id: 'appointments', label: 'Appointments and care', hint: 'Clinics, wellness, education', nouns: { person: 'client', people: 'clients', work: 'booking', works: 'bookings' } },
  { id: 'property', label: 'Property and sales', hint: 'Real estate, brokerage', nouns: { person: 'client', people: 'clients', work: 'deal', works: 'deals' } },
  { id: 'products', label: 'Products and orders', hint: 'Online stores, retail, makers', nouns: { person: 'customer', people: 'customers', work: 'order', works: 'orders' } },
  { id: 'projects', label: 'Projects and field services', hint: 'Maintenance, contracting, installation', nouns: { person: 'client', people: 'clients', work: 'job', works: 'jobs' } },
  { id: 'other', label: 'Something else', hint: '', nouns: { person: 'client', people: 'clients', work: 'job', works: 'jobs' } },
]

export const TEAM_SIZES = ['Just me', '2 to 5', '6 to 20', '21 or more']

export type AreaId = 'found' | 'reply' | 'followup' | 'start' | 'info' | 'track' | 'paid' | 'after' | 'owner'

/** what they believe is wrong, which the plan compares with what their answers show */
export const BELIEFS: { id: string; label: string; said: (n: Nouns) => string; areas: AreaId[] }[] = [
  { id: 'clients', label: 'We need more clients or sales', said: (n) => `you need more ${n.people}`, areas: ['found', 'reply', 'followup', 'after'] },
  { id: 'enquiries', label: 'Too many enquiries go nowhere', said: () => 'too many enquiries go nowhere', areas: ['reply', 'followup'] },
  { id: 'routine', label: 'Too much time goes into routine work', said: () => 'too much time goes into routine work', areas: ['start', 'info', 'paid'] },
  { id: 'visibility', label: 'It’s hard to know what’s happening across the business', said: () => 'it’s hard to see what’s happening', areas: ['info', 'track'] },
  { id: 'owner', label: 'Too much depends on me', said: () => 'too much depends on you', areas: ['owner', 'info', 'track'] },
  { id: 'growth', label: 'We’re busy, but struggling to grow', said: () => 'you’re busy but struggling to grow', areas: ['owner', 'track', 'after', 'followup'] },
]

/** 0 working, 1 some risk, 2 at risk, null unknown */
export type Score = 0 | 1 | 2 | null

type Option = { text: string; score: Score; /** not unknown, just not how they work */ na?: boolean }

const notSure: Option = { text: 'I’m not sure', score: null }

export type Area = {
  id: AreaId
  /** its name on the map of the business */
  stage: string
  question: (n: Nouns, solo: boolean) => string
  options: (n: Nouns, solo: boolean) => Option[]
  /** the check against their own records, answered on VERIFY_SCALE */
  verify: (n: Nouns, solo: boolean) => string
  headline: (n: Nouns) => string
  why: (n: Nouns) => string
  /** the check they can run themselves */
  check: (n: Nouns, solo: boolean) => string[]
  /** the fix that needs no new system */
  simple: (n: Nouns, solo: boolean) => string
  /** when a system, automation or an AI agent is worth it, and not before */
  bigger: (n: Nouns) => string
  see: { label: string; href: string }
}

/** in the order work moves through a business */
export const AREAS: Area[] = [
  {
    id: 'found',
    stage: 'Getting found',
    question: (n) => `Think of your last five new ${n.people}. Where did they come from?`,
    options: () => [
      { text: 'Several places we can name: search, referrals, social media, partners', score: 0 },
      { text: 'Mostly one place, usually word of mouth', score: 1 },
      { text: 'It changes, and we don’t really know why', score: 2 },
      notSure,
    ],
    verify: (n) => `Of your last five new ${n.people}, how many could you say exactly how they found you?`,
    headline: (n) => `Find out where your ${n.people} really come from.`,
    why: (n) => `If you don’t know where new ${n.people} come from, it’s hard to do more of what works. Busy and quiet months feel random, and marketing spend becomes a guess.`,
    check: (n) => [
      `List your last ten new ${n.people}.`,
      'Write how each first heard of you. Ask if you don’t know.',
      'Count how many came from each source. Protect the biggest, and ask why any brought none.',
    ],
    simple: (n) => `In your first conversation, ask every new ${n.person}, “How did you hear about us?” Record each answer in the same place.`,
    bigger: () => 'Once you know where people come from, check how you show up on Google, Maps and AI assistants like ChatGPT. That’s a separate check.',
    see: { label: 'See AI discoverability', href: 'https://ai.clauseandcode.com/' },
  },
  {
    id: 'reply',
    stage: 'Replying',
    question: () => 'A new enquiry arrives on a busy afternoon. When does that person usually hear back?',
    options: () => [
      { text: 'Within the hour, with a clear next step', score: 0 },
      { text: 'Later that day, or the next day', score: 1 },
      { text: 'It depends who sees it. Some wait days', score: 2 },
      notSure,
    ],
    verify: () => 'Of your last five enquiries, how many heard back the same day?',
    headline: () => 'Answer every enquiry before they ask someone else.',
    why: (n) => `People often ask more than one business. The first clear reply can win, so slow answers may lose ${n.people} you never knew you had.`,
    check: () => [
      'Check every enquiry channel: WhatsApp, email, Instagram, your website form and missed calls.',
      'For the last five enquiries, note when each arrived and was answered.',
      'Mark any that waited overnight, and any that never got a reply.',
    ],
    simple: (_n, solo) => `Decide who answers each channel${solo ? ' and when you check it' : ''}. Set an instant reply saying when they’ll hear back, and prepare answers to your five most common questions.`,
    bigger: () => 'If enquiries arrive out of hours or too quickly to answer, a customised AI agent can reply straight away, ask your questions and book the call. Anything important still waits for your yes.',
    see: { label: 'See the AI agents at work', href: '/projects#agents' },
  },
  {
    id: 'followup',
    stage: 'Following up',
    question: () => 'Someone asks about prices, then goes quiet. What usually happens?',
    options: () => [
      { text: 'They get a follow-up on a set schedule until they answer', score: 0 },
      { text: 'Someone follows up if they remember', score: 1 },
      { text: 'Nothing, unless they come back to us', score: 2 },
      notSure,
    ],
    verify: (n) => `Of the last five enquiries that didn’t become ${n.people}, how many got a follow-up?`,
    headline: () => 'Make sure every enquiry has a next step.',
    why: () => 'People who go quiet may just be busy, not uninterested. Without a follow-up, your first conversation can go to waste.',
    check: (n) => [
      `List everyone who asked about prices in the last month and didn’t become a ${n.person}.`,
      'Write the date of your last message next to each name.',
      'Count how many never heard from you after the first reply. That number is your follow-up gap.',
    ],
    simple: () => 'Set a schedule, for example days 2, 7 and 14. Keep open enquiries in one list and check it each morning.',
    bigger: () => 'When open enquiries are too many to track by hand, follow-ups can be scheduled to stop when someone replies. An AI agent can personalise each message and wait for your approval before sending.',
    see: { label: 'See a funnel that follows up by itself', href: '/projects#project-quiz-funnel' },
  },
  {
    id: 'start',
    stage: 'Starting the work',
    question: (n) => `Someone says yes. How does the ${n.work} get started?`,
    options: (_n, solo) => [
      { text: solo ? 'The same steps every time, written down' : 'The same steps every time, and everyone knows them', score: 0 },
      { text: 'Roughly the same, but we chase missing details afterwards', score: 1 },
      { text: solo ? 'It depends on the day, and things get missed' : 'It depends who takes it, and things get missed', score: 2 },
      notSure,
    ],
    verify: (n) => `Of your last five new ${n.works}, how many started without anyone chasing missing details?`,
    headline: (n) => `Start every ${n.work} the same way.`,
    why: (n) => `When each ${n.work} starts differently, you chase details later and mistakes can surface at the end. Your ${n.person}’s first experience becomes a list of questions.`,
    check: (n) => [
      `For your last five ${n.works}, list what each needed before starting.`,
      'Mark what was missing at the start and had to be chased.',
      'Anything missing more than once belongs on a start checklist.',
    ],
    simple: (n) => `Create a start checklist and one form to collect everything from the ${n.person}. Use both for every new ${n.work}.`,
    bigger: (n) => `If ${n.works} start often and the same details are typed again and again, the form can create the ${n.work}, send the welcome message and set the first tasks by itself.`,
    see: { label: 'See work that moves itself to the next person', href: '/projects#project-orders' },
  },
  {
    id: 'info',
    stage: 'Finding information',
    question: (n) => `A ${n.person} asks about their ${n.work}. How long does it take to find the answer?`,
    options: (_n, solo) => [
      { text: 'Seconds. It’s all in one place', score: 0 },
      { text: 'A few minutes of searching chats, email and folders', score: 1 },
      { text: solo ? 'Often longer, and sometimes I can’t find it' : 'Often longer, or we have to ask someone', score: 2 },
      notSure,
    ],
    verify: (n, solo) => `Of the last five questions ${n.people} asked about their ${n.work}, how many could ${solo ? 'you' : 'anyone on the team'} answer in under five minutes?`,
    headline: (n) => `Keep everything about each ${n.person} in one place.`,
    why: (n) => `When ${n.work} details are scattered across chats, inboxes and folders, every question becomes a search. Handovers slow down, mistakes creep in and answers live in people’s heads.`,
    check: (n) => [
      `Pick three ${n.works} from this month.`,
      `For each, find the latest message, agreed price and next step. Time how long it takes.`,
      'List every place you looked. That’s where your information lives today.',
    ],
    simple: (n) => `One folder per ${n.person}, named the same way, with every file saved there from today. One shared list of every open ${n.work} with its next step.`,
    bigger: (n) => `When a spreadsheet isn’t enough, a system built around your work can keep ${n.people}, ${n.works} and messages together, fed by the tools you already use.`,
    see: { label: 'See one office with one record per student', href: '/projects#project-academy' },
  },
  {
    id: 'track',
    stage: 'Staying on track',
    question: (n) => `How do you know which ${n.works} are stuck or running late?`,
    options: (n) => [
      { text: `We can see every ${n.work} and where it stands in one place`, score: 0 },
      { text: 'We ask around, or check a few places', score: 1 },
      { text: `Usually when the ${n.person} chases us`, score: 2 },
      notSure,
    ],
    verify: (n) => `Of your last five ${n.works}, how many finished when you said they would?`,
    headline: (n) => `See where every ${n.work} stands without asking.`,
    why: (n) => `If you only learn a ${n.work} is late when the ${n.person} chases you, it’s too late to fix it quietly. Time goes on asking for updates instead of moving work forward.`,
    check: (n) => [
      `Write down every ${n.work} running right now.`,
      'Next to each, write its next step, who owns it and when it is due, without asking anyone.',
      'Each blank is a place work could stall unnoticed.',
    ],
    simple: (n) => `One list of every open ${n.work} with three columns: next step, owner, due date. Review it for ten minutes at the start of each week.`,
    bigger: (n) => `When there are too many ${n.works} to review by hand, a system that moves each one to the next person and flags anything overdue keeps them on track by itself.`,
    see: { label: 'See an order pipeline that runs itself', href: '/projects#project-orders' },
  },
  {
    id: 'paid',
    stage: 'Getting paid',
    question: (n) => `Once the ${n.work} is done, how does the money come in?`,
    options: () => [
      { text: 'Invoiced straight away, and late payments are chased on a schedule', score: 0 },
      { text: 'Invoices go out when someone gets to them', score: 1 },
      { text: 'We often chase late payments, or forget to bill some work', score: 2 },
      { text: 'People pay before we start', score: null, na: true },
      notSure,
    ],
    verify: () => 'Of your last five invoices, how many were paid on time without a reminder?',
    headline: () => 'Send every invoice the day the work is done.',
    why: () => 'Late invoices mean later payment; unbilled work means working for free. Relying on memory to chase payment also lets awkward ones slip.',
    check: () => [
      'List the work finished in the last month.',
      'For each, note when it finished, was invoiced and was paid.',
      'Look for gaps between finishing and invoicing, and for anything with no invoice at all.',
    ],
    simple: (n) => `Invoice on the day each ${n.work} is finished, and set one day a week to send reminders for anything overdue.`,
    bigger: (n) => `If invoices are still typed by hand, they can be built from the ${n.work} itself and reminders sent on a schedule, connected to the accounting software you already use.`,
    see: { label: 'See an order pipeline that runs itself', href: '/projects#project-orders' },
  },
  {
    id: 'after',
    stage: 'After the work',
    question: (n) => `After the ${n.work} is finished, what happens with that ${n.person}?`,
    options: () => [
      { text: 'We ask for a review or referral, and stay in touch on a schedule', score: 0 },
      { text: 'We stay in touch with some, when we think of it', score: 1 },
      { text: 'Not much, until they come back on their own', score: 2 },
      notSure,
    ],
    verify: (n) => `Of your last five finished ${n.works}, how many ${n.people} did you ask for a review or a referral?`,
    headline: (n) => `Ask every happy ${n.person} for what comes next.`,
    why: (n) => `A ${n.person} who just had a good experience is easiest to ask for a review, referral or next ${n.work}. Weeks later, the moment may have passed.`,
    check: (n) => [
      `List your last ten finished ${n.works}.`,
      `Mark which ${n.people} you asked for a review or referral, and which came back for more.`,
      'Count the ones you never contacted again.',
    ],
    simple: (n) => `Send one message the day each ${n.work} is finished: thank them, ask for a review, and say what to do if they know someone who needs you.`,
    bigger: () => 'When there are too many to remember, review requests and check-ins can go out automatically at the right time.',
    see: { label: 'See a complete membership system', href: '/projects#project-membership' },
  },
  {
    id: 'owner',
    stage: 'Running without you',
    question: (_n, solo) => (solo ? 'How much of how you run things is written down, outside your head?' : 'If you were away for two weeks, what would happen?'),
    options: (_n, solo) =>
      solo
        ? [
            { text: 'Most of it: templates, checklists, a system', score: 0 },
            { text: 'Some of it. The rest is in my head', score: 1 },
            { text: 'Almost none. It’s all in my head', score: 2 },
            notSure,
          ]
        : [
            { text: 'The work carries on, and the team decides most things', score: 0 },
            { text: 'It carries on, but questions wait for me', score: 1 },
            { text: 'Much of it stops or waits for me', score: 2 },
            notSure,
          ],
    verify: (_n, solo) =>
      solo
        ? 'Of the five tasks you do most often, how many have a written checklist or template?'
        : 'Think of the last five questions your team brought to you. How many already had a written answer somewhere?',
    headline: () => 'Write down what only you know.',
    why: () => 'When how you work lives in your head, questions and decisions come back to you. The business moves only as fast as you can answer.',
    check: (_n, solo) =>
      solo
        ? ['For one week, note every task you do more than once.', 'Mark the ones you could hand to someone else if the steps were written down.', 'Those are the first to write up.']
        : ['For one week, write down every question your team brings to you.', 'Mark the ones you have answered before.', 'Each repeat is something to write down once and stop answering.'],
    simple: (_n, solo) =>
      solo
        ? 'Write a one-page checklist for the task you do most, and a template for the message you send most. Add one a week.'
        : 'Answer each repeat question once, in writing, somewhere the team can find it. Then walk one person through a task only you do.',
    bigger: () => 'Once the steps are written, a system can move work to the next person, and customised AI agents can handle routine tasks. Anything important still waits for your yes.',
    see: { label: 'See the AI agents at work', href: '/projects#agents' },
  },
]

/** how the check against their own records is answered */
export const VERIFY_SCALE: Option[] = [
  { text: 'All five', score: 0 },
  { text: 'Three or four', score: 1 },
  { text: 'One or two', score: 2 },
  { text: 'None', score: 2 },
  { text: 'I can’t check that easily', score: null },
]

/** where a weak point in one stage makes another worse */
const CONNECTIONS: { from: AreaId; to: AreaId; line: (n: Nouns) => string }[] = [
  { from: 'info', to: 'start', line: (n) => `Details that are hard to find slow down the start of every ${n.work}.` },
  { from: 'start', to: 'track', line: (n) => `${cap(n.works)} that start without everything in place are harder to keep on track.` },
  { from: 'track', to: 'owner', line: (n) => `When nobody can see where ${n.works} stand, the questions come to you.` },
  { from: 'info', to: 'owner', line: () => 'When information lives in chats and in people’s heads, people ask you instead of looking it up.' },
  { from: 'reply', to: 'followup', line: () => 'Slow first replies mean more people go quiet, so follow-ups matter even more.' },
  { from: 'followup', to: 'found', line: (n) => `Enquiries that never get a follow-up can look like a shortage of new ${n.people}.` },
  { from: 'track', to: 'paid', line: (n) => `When it isn’t clear a ${n.work} is finished, the invoice goes out late.` },
  { from: 'after', to: 'found', line: (n) => `Past ${n.people} who are never asked for a referral are new ${n.people} you never hear from.` },
]

/** when two stages weigh the same, the one that usually costs most comes first */
const TIE_ORDER: AreaId[] = ['followup', 'reply', 'info', 'start', 'track', 'owner', 'paid', 'after', 'found']

/** above this many "not sure" answers, the plan says it is a first read */
const TENTATIVE = 4

export const QUIZ = {
  label: 'Not sure where to start?',
  heading: 'Where is your business',
  emphasis: 'losing time?',
  intro:
    'A few short questions about what actually happens in your business, from the first enquiry to getting paid. You’ll see where work slows down, what it’s affecting, and a check you can run on your own records to confirm it.',
  points: ['What to fix first, and why', 'A check you can run yourself', 'Yours to keep'],
  meta: 'About 3 minutes',
  action: 'Get my plan',
  close: {
    heading: 'Let’s look at what’s actually causing this.',
    body: 'On a free 20-minute call we go through your answers, look at how this part of your business really runs, and tell you whether it needs a checklist, a better process or a system. If a checklist is enough, we’ll say so.',
  },
}

/** What a visitor answered, as indexes into the lists above. */
export type QuizAnswers = {
  model: string
  /** An optional description when the business type is "Something else". */
  otherBusiness?: string
  team: number
  belief: string
  /** one option index per area, in AREAS order */
  answers: number[]
  /** the VERIFY_SCALE index for the check, or null when it wasn't asked */
  extra: number | null
}

/** Keep a short, single-line description safe for summaries and storage. */
export function cleanOtherBusiness(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80).trim()
  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : null
}

export const nounsFor = (model: string) => (MODELS.find((m) => m.id === model) ?? MODELS[MODELS.length - 1]).nouns

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const scoresOf = (a: Pick<QuizAnswers, 'team' | 'answers' | 'model'>) => {
  const n = nounsFor(a.model)
  const solo = a.team === 0
  return AREAS.map((area, i) => area.options(n, solo)[a.answers[i]] as Option | undefined)
}

/** the weak stages, most worth fixing first */
function rank(a: Pick<QuizAnswers, 'team' | 'answers' | 'model' | 'belief'>): AreaId[] {
  const picked = scoresOf(a)
  const score = (id: AreaId) => picked[AREAS.findIndex((x) => x.id === id)]?.score ?? null
  const belief = BELIEFS.find((b) => b.id === a.belief)
  // a stage that makes another weak stage worse is worth fixing before it
  const downstream = (id: AreaId) => CONNECTIONS.filter((c) => c.from === id && (score(c.to) ?? 0) >= 1).length
  const priority = (id: AreaId) => (score(id) ?? 0) * 2 + downstream(id)
  // what they believe is wrong only breaks ties: the answers decide
  const aligned = (id: AreaId) => (belief?.areas.includes(id) ? 1 : 0)
  return AREAS.map((x) => x.id)
    .filter((id) => (score(id) ?? 0) >= 1)
    .sort((x, y) => priority(y) - priority(x) || aligned(y) - aligned(x) || TIE_ORDER.indexOf(x) - TIE_ORDER.indexOf(y))
}

/** The stage the check question is about, or null when nothing stands out. */
export function verifyTarget(a: Pick<QuizAnswers, 'team' | 'answers' | 'model' | 'belief'>): Area | null {
  const [top] = rank(a)
  return top ? AREAS.find((x) => x.id === top)! : null
}

/**
 * Keeps only answers that point at something real, so a plan can only ever be
 * built from this file. Returns null if anything is missing or out of range.
 */
export function cleanAnswers(raw: unknown): QuizAnswers | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const index = (v: unknown, length: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < length ? (v as number) : null)
  const model = typeof r.model === 'string' && MODELS.some((m) => m.id === r.model) ? r.model : null
  const belief = typeof r.belief === 'string' && BELIEFS.some((b) => b.id === r.belief) ? r.belief : null
  const team = index(r.team, TEAM_SIZES.length)
  if (model === null || belief === null || team === null) return null
  // Older quiz sessions may not have a description; validate it when present.
  const otherBusiness = model === 'other' && r.otherBusiness !== undefined ? cleanOtherBusiness(r.otherBusiness) : undefined
  if (otherBusiness === null) return null
  const n = nounsFor(model)
  const answers = Array.isArray(r.answers) ? r.answers.map((v, i) => (AREAS[i] ? index(v, AREAS[i].options(n, team === 0).length) : null)) : []
  if (answers.length !== AREAS.length || answers.some((v) => v === null)) return null
  const clean = { model, ...(otherBusiness ? { otherBusiness } : {}), team, belief, answers: answers as number[] }
  // the check is only asked when a stage stands out
  const extra = verifyTarget(clean) ? index(r.extra, VERIFY_SCALE.length) : null
  if (verifyTarget(clean) && extra === null) return null
  return { ...clean, extra }
}

export type Status = 'working' | 'some' | 'risk' | 'first' | 'unclear' | 'na'

export const STATUS_LABEL: Record<Status, string> = {
  working: 'Working',
  some: 'Some risk',
  risk: 'At risk',
  first: 'Fix this first',
  unclear: 'Not sure',
  na: 'Not relevant',
}

export type Plan = {
  model: string
  nouns: Nouns
  solo: boolean
  /** null when nothing stands out */
  area: Area | null
  headline: string
  /** what they believed, set against what their answers show */
  compare: string
  /** too many "not sure" answers to be more than a first read */
  tentative: boolean
  /** the answers behind the finding */
  evidence: { question: string; answer: string }[]
  /** how the weak point feeds another: from causes to */
  connection: { from: string; to: string; line: string } | null
  why: string
  check: string[]
  simple: string
  bigger: string
  see: { label: string; href: string }
  map: { stage: string; status: Status }[]
  unclear: string[]
}

const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/** The plan, read from the answers alone. */
export function buildPlan(a: QuizAnswers): Plan {
  const n = nounsFor(a.model)
  const solo = a.team === 0
  const picked = scoresOf(a)
  const score = (id: AreaId) => picked[AREAS.findIndex((x) => x.id === id)]?.score ?? null
  const belief = BELIEFS.find((b) => b.id === a.belief)!
  const ranked = rank(a)
  const checked = a.extra === null ? null : VERIFY_SCALE[a.extra]

  // their own records outrank how it felt: if the check came back fine,
  // the next weak stage is the one to look at first
  let top = ranked[0]
  let movedFrom: Area | null = null
  if (checked?.score === 0 && ranked[1]) {
    movedFrom = AREAS.find((x) => x.id === ranked[0])!
    top = ranked[1]
  }
  const area = top ? AREAS.find((x) => x.id === top)! : null

  const unknown = AREAS.filter((_, i) => picked[i]?.score === null && !picked[i]?.na)
  const tentative = unknown.length >= TENTATIVE

  const map = AREAS.map((x, i) => {
    const s = picked[i]
    const status: Status = s?.na ? 'na' : x.id === top ? 'first' : x === movedFrom ? 'some' : s?.score == null ? 'unclear' : (['working', 'some', 'risk'] as const)[s.score]
    return { stage: x.stage, status }
  })

  const unclear: string[] = []
  if (unknown.length) {
    unclear.push(`You weren’t sure about ${list(unknown.map((x) => x.stage.toLowerCase()))}, so we left ${unknown.length > 1 ? 'them' : 'it'} out. That’s worth a look too.`)
  }
  if (belief.id === 'clients' && top !== 'found') {
    unclear.push(`Whether you need more enquiries or need to win more of those you get. Your answers show what happens to enquiries, not how many arrive.`)
  }
  if (belief.id === 'clients' || top === 'found') {
    unclear.push('How visible you are on Google, Maps and AI assistants. That needs a separate look at your listings.')
  }
  if (checked?.score === null) unclear.push('What your own records would show. Running the check is the best next step.')

  if (!area) {
    return {
      model: a.model,
      nouns: n,
      solo,
      area: null,
      headline: 'Nothing in how your work moves stands out as broken.',
      compare: tentative
        ? `You came in thinking ${belief.said(n)}. Several answers were “not sure”, so the first step is finding out how those parts really run.`
        : `You came in thinking ${belief.said(n)}. Your answers say the way work moves is holding up, so the gain now is growth rather than repair.`,
      tentative,
      evidence: [],
      connection: null,
      why: 'When the basics hold, growth comes from more of what works: more of the right enquiries and more from existing clients.',
      check: AREAS.find((x) => x.id === belief.areas[0])!.check(n, solo),
      simple: 'Run the check above on your own records. If things are working, write down why, so they keep working as you grow.',
      bigger: 'To grow without adding work, a system or customised AI agents can help. Book a consultation and we’ll look at it together.',
      see: { label: 'See what we’ve built', href: '/projects' },
      map,
      unclear,
    }
  }

  const i = AREAS.indexOf(area)
  const link = CONNECTIONS.find((c) => (c.from === top && (score(c.to) ?? 0) >= 1) || (c.to === top && (score(c.from) ?? 0) >= 1))
  const other = link ? AREAS.find((x) => x.id === (link.from === top ? link.to : link.from))! : null

  const evidence = [{ question: area.question(n, solo), answer: picked[i]!.text }]
  if (other) evidence.push({ question: other.question(n, solo), answer: picked[AREAS.indexOf(other)]!.text })
  if (movedFrom && checked) evidence.unshift({ question: movedFrom.verify(n, solo), answer: checked.text })
  else if (checked && checked.score !== null) evidence.push({ question: area.verify(n, solo), answer: checked.text })

  const agrees = belief.areas.includes(area.id)
  const said = `You came in thinking ${belief.said(n)}.`
  const compare = movedFrom
    ? `${said} Your records suggest ${movedFrom.stage.toLowerCase()} is holding up better than it felt. Check ${area.stage.toLowerCase()} next.`
    : agrees
      ? `${said} Your answers agree, and point to where it starts: ${area.stage.toLowerCase()}.`
      : `${said} Your answers point to something worth checking first: ${area.stage.toLowerCase()}.`

  return {
    model: a.model,
    nouns: n,
    solo,
    area,
    headline: area.headline(n),
    compare,
    tentative,
    evidence,
    connection: link
      ? { from: AREAS.find((x) => x.id === link.from)!.stage, to: AREAS.find((x) => x.id === link.to)!.stage, line: link.line(n) }
      : null,
    why: area.why(n),
    check: area.check(n, solo),
    simple: area.simple(n, solo),
    bigger: area.bigger(n),
    see: area.see,
    map,
    unclear,
  }
}

/** The answers as a short summary: for our notes and the WhatsApp message. */
export function answerSummary(a: QuizAnswers): string[] {
  const n = nounsFor(a.model)
  const solo = a.team === 0
  const target = verifyTarget(a)
  return [
    `Business: ${MODELS.find((m) => m.id === a.model)!.label}${a.model === 'other' && a.otherBusiness ? ` — ${a.otherBusiness}` : ''}, team: ${TEAM_SIZES[a.team].toLowerCase()}`,
    `Thinks the problem is: ${BELIEFS.find((b) => b.id === a.belief)!.label}`,
    ...AREAS.map((area, i) => `${area.stage}: ${area.options(n, solo)[a.answers[i]].text}`),
    ...(target && a.extra !== null ? [`Check (${target.stage.toLowerCase()}): ${VERIFY_SCALE[a.extra].text}`] : []),
  ]
}

/** A prefilled WhatsApp message, so the first conversation starts from the plan. */
export function whatsappLink(a: QuizAnswers): string {
  const plan = buildPlan(a)
  const first = plan.area ? `My first priority came out as ${plan.area.stage.toLowerCase()}: “${plan.headline}”` : 'Nothing stood out as broken.'
  const text = [`Hi Clause & Code, I took the business fix plan. ${first}`, '', ...answerSummary(a)].join('\n')
  return `${site.contact.whatsapp}?text=${encodeURIComponent(text)}`
}
