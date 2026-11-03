/**
 * The emails that follow the business fix plan, written and rendered here so
 * the server only has to send them (see docs/quiz-backend.md).
 *
 * Who gets what:
 * - Everyone who asks for a copy gets the plan email straight away.
 * - Only people who ticked the separate box get the four notes after it,
 *   on days 2, 5, 9 and 14. Each one is about their first priority, and
 *   each has one job: run the check, see what good looks like, know when the
 *   simple fix is enough, and an offer of a second pair of eyes.
 * - We get a short notification for every plan sent.
 *
 * Every email is built from the visitor's answers and this file. The only
 * thing a visitor typed that appears in an email is their first name, escaped.
 */

import { site } from '../config/site'
import { AREAS, BELIEFS, MODELS, STATUS_LABEL, TEAM_SIZES, answerSummary, buildPlan, type AreaId, type Nouns, type Plan, type QuizAnswers, type Status } from './quiz'

const ORIGIN = 'https://clauseandcode.com'
const absolute = (href: string) => (href.startsWith('/') ? `${ORIGIN}${href}` : href)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** What each note says about a stage, beyond what the plan already says. */
type Notes = {
  /** day 2: how to read the result of the check */
  reading: (n: Nouns, solo: boolean) => string
  /** day 5: what this stage looks like when it works */
  good: (n: Nouns, solo: boolean) => string[]
  /** day 9: signs the simple fix is no longer enough */
  outgrown: (n: Nouns, solo: boolean) => string[]
}

const NOTES: Record<AreaId, Notes> = {
  found: {
    reading: () => 'If you couldn’t say where most of them came from, that is the finding: start asking every new client from today. If you could, look at which place brought the most, and protect it.',
    good: (n) => [
      `Every new ${n.person} is asked how they found you, and the answer goes in the same place every time.`,
      'You know your top two or three sources, and look at them once a month.',
      'When a source goes quiet, you notice within weeks, not at the end of the year.',
    ],
    outgrown: () => [
      'You know where people come from, but not why some months are quiet.',
      'Most enquiries come from one source you don’t control.',
      'People search for what you do and find someone else first.',
    ],
  },
  reply: {
    reading: () => 'If fewer than three of the five heard back the same day, replies depend on who happens to be free. If all five did, replying is working and the gain is somewhere else.',
    good: (_n, solo) => [
      solo ? 'You check each channel at set times, not whenever you remember.' : 'Every channel has one named person who checks it, at set times.',
      'Anyone who writes gets an instant reply saying when they’ll hear back.',
      'Your best answers to the common questions are written down, so every reply sounds like you.',
    ],
    outgrown: () => [
      'Enquiries arrive in the evening or at weekends, when nobody is there to answer.',
      'The same few questions take up most of the replying.',
      'Enquiries arrive in more places than anyone can watch.',
    ],
  },
  followup: {
    reading: () => 'The number of people who never heard from you after the first reply is your follow-up gap. Even two or three a month adds up to clients you will never know you lost.',
    good: () => [
      'Every open enquiry is on one list, with the date of its next follow-up.',
      'Follow-ups go out on set days, for example day 2, day 7 and day 14, and stop when the person replies.',
      'Each follow-up says something useful, not just “checking in”.',
    ],
    outgrown: () => [
      'The list of open enquiries is longer than you can check each morning.',
      'Follow-ups still slip in busy weeks, even with a rule.',
      'You want each follow-up to answer what that person asked, without writing it from scratch.',
    ],
  },
  start: {
    reading: (n) => `Anything you had to chase more than once is a gap in how work starts. If two or more details were chased across five ${n.works}, a start checklist will pay for itself in the first week.`,
    good: (n) => [
      `Every new ${n.work} starts from the same checklist.`,
      `One form collects everything you need from the ${n.person} at once.`,
      `The ${n.person} gets a welcome message that says what happens next, and when.`,
    ],
    outgrown: (n, solo) => [
      'The same details are typed into two or three places.',
      `New ${n.works} come in faster than anyone can set them up.`,
      solo ? 'Setting up new work takes time you should spend doing it.' : 'Different people still start work in different ways, even with a checklist.',
    ],
  },
  info: {
    reading: (n) => `Count the places you had to look. More than three for one ${n.work} means the information is scattered. One or two means you are closer than it felt.`,
    good: (n, solo) => [
      `Every ${n.person} has one folder, named the same way.`,
      `One shared list shows every open ${n.work} and its next step.`,
      solo ? `You can answer any ${n.person}’s question in under a minute.` : `Anyone on the team can answer a ${n.person}’s question without asking someone else.`,
    ],
    outgrown: (n) => [
      'The shared list has outgrown a spreadsheet.',
      'Information is copied by hand from WhatsApp, email and forms.',
      `You can’t see a ${n.person}’s whole history in one place.`,
    ],
  },
  track: {
    reading: (n) => `Every blank you couldn’t fill without asking is a ${n.work} that could stall without anyone noticing. If you filled every line, tracking is working and the gain is somewhere else.`,
    good: (n) => [
      `One list of every open ${n.work}, with its next step, owner and due date.`,
      'Ten minutes at the start of each week to look at anything overdue.',
      `${cap(n.people)} hear about a delay from you, before they have to ask.`,
    ],
    outgrown: (n) => [
      `There are too many ${n.works} to review in ten minutes.`,
      'Work waits because nobody knew it was their turn.',
      `You still hear about delays from ${n.people} first.`,
    ],
  },
  paid: {
    reading: () => 'Any gap of more than a few days between finishing and invoicing is money waiting. Anything with no invoice at all is work done for free.',
    good: () => [
      'Invoices go out the day the work is done.',
      'One set day a week for reminders on anything overdue.',
      'Payment terms are agreed in writing before the work starts.',
    ],
    outgrown: (n) => [
      `Invoices are still typed by hand from the details of each ${n.work}.`,
      'Reminders depend on someone remembering.',
      'You can’t see at a glance who owes what.',
    ],
  },
  after: {
    reading: (n) => `Count the ${n.people} you never contacted again. Each one is a review, a referral or a repeat ${n.work} you didn’t ask for.`,
    good: (n) => [
      `A thank-you message goes out the day each ${n.work} ends, with a link to leave a review.`,
      `Happy ${n.people} are asked, simply, if they know someone who needs you.`,
      `Past ${n.people} hear from you a few times a year with something useful.`,
    ],
    outgrown: (n) => [
      `There are too many finished ${n.works} to remember who to contact.`,
      'Reviews come in, but not steadily.',
      `Repeat ${n.works} depend on ${n.people} remembering you.`,
    ],
  },
  owner: {
    reading: (_n, solo) =>
      solo
        ? 'Every task you could hand over if the steps were written down is the first page of your manual. Start with the one you do most.'
        : 'Every question you have answered before is something to write down once. If most already had a written answer, your team is closer to running without you than it feels.',
    good: (_n, solo) =>
      solo
        ? ['Your most common tasks each have a one-page checklist.', 'Your most common messages are templates.', 'Someone could cover for a week using only what is written down.']
        : ['The questions you get most are answered in writing, where the team can find them.', 'Each routine task has a one-page checklist.', 'Decisions under an agreed limit are made without you.'],
    outgrown: () => [
      'Work waits for you to pass it on to the next person.',
      'The written steps exist, but they are hard to find, so nobody follows them.',
      'Routine work still takes up most of your week.',
    ],
  },
}

/** A piece of an email. The renderer turns each into HTML and plain text. */
export type Block =
  | { type: 'p'; text: string; tone?: 'soft' | 'italic' | 'muted' }
  | { type: 'eyebrow'; text: string }
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'glance'; items: { n: number; label: string; color: string }[] }
  | { type: 'map'; rows: { stage: string; status: Status }[] }
  | { type: 'arrow'; from: string; to: string }
  | { type: 'step'; n: number; title: string; note?: string }
  | { type: 'answers'; items: { question: string; answer: string }[] }
  | { type: 'buttons'; items: { label: string; href: string; primary?: boolean }[] }
  | { type: 'link'; label: string; href: string }
  | { type: 'rule' }
  | { type: 'facts'; items: [string, string][] }

export type Email = {
  id: 'plan' | 'day2' | 'day5' | 'day9' | 'day14' | 'team'
  /** days after the plan was sent */
  day: number
  subject: string
  /** the grey line inboxes show after the subject */
  preheader: string
  blocks: Block[]
  /** marketing notes carry an unsubscribe link; the plan and team emails don't */
  marketing: boolean
}

const COLORS = { gold: '#E1AD34', goldText: '#A97E1C', blue: '#2D6D8B', ink: '#1B1A17', soft: '#4A4740', muted: '#7A766D', line: '#E6E1D8', cream: '#F8F5F0' }

const buttons = (): Block => ({
  type: 'buttons',
  items: [
    { label: 'Book a call', href: site.links.booking, primary: true },
    { label: 'Message us on WhatsApp', href: site.contact.whatsapp },
  ],
})

const signoff: Block[] = [{ type: 'p', text: 'Clause & Code', tone: 'soft' }]

/** the stage the notes are about: the first priority, or what they believed when nothing stood out */
function focusOf(a: QuizAnswers, p: Plan) {
  return p.area ?? AREAS.find((x) => x.id === BELIEFS.find((b) => b.id === a.belief)!.areas[0])!
}

/** The plan, as an email: the same sections as the page, in the same order. */
export function planEmail(a: QuizAnswers, name: string): Email {
  const p = buildPlan(a)
  const count = (...s: Status[]) => p.map.filter((row) => s.includes(row.status)).length
  const glance = [
    { n: count('working'), label: 'working well', color: COLORS.blue },
    { n: count('some', 'risk'), label: 'worth watching', color: COLORS.goldText },
    { n: count('first'), label: 'to fix first', color: COLORS.goldText },
    { n: count('unclear'), label: 'not sure', color: COLORS.muted },
  ].filter((g) => g.n > 0)

  const blocks: Block[] = [
    { type: 'p', text: `Hi ${name},` },
    { type: 'p', text: 'Here is the business fix plan you asked for. Keep it somewhere you’ll find it when you sit down to run the check.' },
    { type: 'rule' },
    ...(p.area ? [{ type: 'eyebrow', text: `Fix first: ${p.area.stage.toLowerCase()}` } as Block] : []),
    { type: 'h1', text: p.headline },
    { type: 'p', text: p.compare, tone: 'italic' },
    ...(p.tentative ? [{ type: 'p', text: 'You weren’t sure about several answers, so treat this as a first read.', tone: 'muted' } as Block] : []),
    { type: 'glance', items: glance },
    { type: 'rule' },
    { type: 'h2', text: 'Where things stand' },
    { type: 'map', rows: p.map },
  ]
  if (p.connection) {
    blocks.push({ type: 'rule' }, { type: 'h2', text: 'How one problem feeds another' }, { type: 'arrow', from: p.connection.from, to: p.connection.to }, { type: 'p', text: p.connection.line, tone: 'soft' })
  }
  blocks.push(
    { type: 'rule' },
    { type: 'h2', text: 'Why it matters' },
    { type: 'p', text: p.why },
    { type: 'rule' },
    { type: 'h2', text: 'What to do next' },
    { type: 'step', n: 1, title: 'Check it on your own records', note: 'About 20 minutes' },
    { type: 'list', items: p.check, ordered: true },
    { type: 'step', n: 2, title: 'Fix it, simplest way first' },
    { type: 'eyebrow', text: 'Start here' },
    { type: 'p', text: p.simple },
    { type: 'eyebrow', text: 'If that isn’t enough' },
    { type: 'p', text: p.bigger, tone: 'soft' },
    { type: 'link', label: p.see.label, href: absolute(p.see.href) },
  )
  if (p.evidence.length) blocks.push({ type: 'rule' }, { type: 'h2', text: 'Based on what you told us' }, { type: 'answers', items: p.evidence })
  if (p.unclear.length) blocks.push({ type: 'rule' }, { type: 'h2', text: 'What we couldn’t tell' }, { type: 'list', items: p.unclear })
  blocks.push(
    { type: 'rule' },
    { type: 'h2', text: 'Let’s look at what’s actually causing this' },
    { type: 'p', text: 'On a short call we go through your answers, look at how this part of your business really runs, and tell you whether it needs a checklist, a better process or a system. If a checklist is enough, we’ll say so.' },
    buttons(),
    ...signoff,
  )

  return {
    id: 'plan',
    day: 0,
    subject: p.area ? `Your fix plan: ${lower(p.headline).replace(/\.$/, '')}` : 'Your business fix plan',
    preheader: 'Start with the 20-minute check on your own records.',
    blocks,
    marketing: false,
  }
}

/** The four notes after the plan, for people who ticked the box. */
export function followUps(a: QuizAnswers, name: string): Email[] {
  const p = buildPlan(a)
  const n = p.nouns
  const solo = p.solo
  const area = focusOf(a, p)
  const notes = NOTES[area.id]
  const stage = area.stage.toLowerCase()
  const pointed = p.area ? `your fix plan pointed to ${stage}` : `your fix plan found nothing broken, and we suggested keeping an eye on ${stage}`

  return [
    {
      id: 'day2',
      day: 2,
      subject: 'Did you run the check?',
      preheader: `What the result says about ${stage}.`,
      marketing: true,
      blocks: [
        { type: 'p', text: `Hi ${name},` },
        { type: 'p', text: `Two days ago ${pointed}. The quickest way to know if that is right is the check, on your own records:` },
        { type: 'list', items: area.check(n, solo), ordered: true },
        { type: 'h2', text: 'What the result tells you' },
        { type: 'p', text: notes.reading(n, solo) },
        { type: 'p', text: 'Reply to this email with what you found, and we’ll tell you what we would do next.', tone: 'soft' },
        ...signoff,
      ],
    },
    {
      id: 'day5',
      day: 5,
      subject: `What good ${stage} looks like`,
      preheader: 'Three signs this part of your business is working.',
      marketing: true,
      blocks: [
        { type: 'p', text: `Hi ${name},` },
        { type: 'p', text: `When ${stage} works, nobody notices it. In a business like yours, it looks like this:` },
        { type: 'list', items: notes.good(n, solo) },
        { type: 'p', text: 'Read them as a checklist. Any line that isn’t true for you yet is where to start, and the simplest way in is the one from your plan:' },
        { type: 'p', text: area.simple(n, solo), tone: 'italic' },
        ...signoff,
      ],
    },
    {
      id: 'day9',
      day: 9,
      subject: 'When a checklist is enough, and when it isn’t',
      preheader: 'Signs you have outgrown the simple fix.',
      marketing: true,
      blocks: [
        { type: 'p', text: `Hi ${name},` },
        { type: 'p', text: `Most of the time, the simple fix for ${stage} is enough:` },
        { type: 'p', text: area.simple(n, solo), tone: 'italic' },
        { type: 'h2', text: 'Signs you have outgrown it' },
        { type: 'list', items: notes.outgrown(n, solo) },
        { type: 'p', text: `If two or more sound familiar, that is when a system is worth it. ${area.bigger(n)}` },
        { type: 'p', text: 'If none do, stay with the checklist. It costs nothing and it is yours.', tone: 'soft' },
        { type: 'link', label: area.see.label, href: absolute(area.see.href) },
        ...signoff,
      ],
    },
    {
      id: 'day14',
      day: 14,
      subject: 'A second pair of eyes on your answers',
      preheader: 'A short call to look at what is actually causing this.',
      marketing: true,
      blocks: [
        { type: 'p', text: `Hi ${name},` },
        { type: 'p', text: `Two weeks ago ${pointed}.` },
        { type: 'p', text: 'Sometimes a checklist sorts it. Sometimes what looks like one problem is coming from somewhere else, and that is hard to see from inside the business.' },
        { type: 'p', text: `If you’d like, book a short call. We’ll go through your answers, look at how ${stage} really runs for you, and tell you whether it needs a checklist, a better process or a system. If a checklist is enough, we’ll say so.` },
        buttons(),
        { type: 'p', text: 'This is the last note about your plan.', tone: 'muted' },
        ...signoff,
      ],
    },
  ]
}

/** The notification to us, for every plan sent. */
export function teamEmail(a: QuizAnswers, lead: { name: string; email: string; marketing: boolean }): Email {
  const p = buildPlan(a)
  return {
    id: 'team',
    day: 0,
    subject: `New fix plan: ${lead.name} · ${p.area ? p.area.stage.toLowerCase() : 'nothing stood out'}`,
    preheader: p.headline,
    marketing: false,
    blocks: [
      { type: 'h2', text: `${lead.name} took the business fix plan` },
      {
        type: 'facts',
        items: [
          ['Email', lead.email],
          ['Follow-up notes', lead.marketing ? 'Yes, they ticked the box' : 'No, plan email only'],
          ['Business', MODELS.find((m) => m.id === a.model)!.label],
          ['Team', TEAM_SIZES[a.team]],
          ['Thinks the problem is', BELIEFS.find((b) => b.id === a.belief)!.label],
          ['Fix first', p.area ? p.area.stage : 'Nothing stood out'],
          ['Headline', p.headline],
          ...(p.tentative ? [['Note', 'Many “not sure” answers'] as [string, string]] : []),
        ],
      },
      { type: 'h2', text: 'Their answers' },
      { type: 'list', items: answerSummary(a) },
    ],
  }
}

/* ---------- Rendering ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const SERIF = `'Source Serif 4', Georgia, 'Times New Roman', serif`
const SANS = `Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

const MARK: Record<Status, { glyph: string; color: string }> = {
  working: { glyph: '●', color: COLORS.blue },
  some: { glyph: '○', color: COLORS.gold },
  risk: { glyph: '●', color: COLORS.gold },
  first: { glyph: '◉', color: COLORS.gold },
  unclear: { glyph: '◌', color: COLORS.muted },
  na: { glyph: '–', color: COLORS.muted },
}
const TONE: Record<Status, string> = {
  working: COLORS.blue,
  some: COLORS.soft,
  risk: COLORS.goldText,
  first: COLORS.goldText,
  unclear: COLORS.muted,
  na: COLORS.muted,
}

const P = (style: string, html: string) => `<p style="margin:0 0 16px;${style}">${html}</p>`

function blockHtml(b: Block): string {
  const body = `font-family:${SANS};font-size:16px;line-height:1.6;color:${COLORS.ink};`
  switch (b.type) {
    case 'p': {
      const tone = b.tone === 'italic' ? `font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.45;color:${COLORS.blue};` : b.tone === 'soft' ? `color:${COLORS.soft};` : b.tone === 'muted' ? `font-size:14px;color:${COLORS.muted};` : ''
      return P(body + tone, esc(b.text))
    }
    case 'eyebrow':
      return P(`font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${COLORS.goldText};margin-top:8px;margin-bottom:6px;`, esc(b.text))
    case 'h1':
      return `<h1 style="margin:0 0 14px;font-family:${SERIF};font-weight:600;font-size:30px;line-height:1.15;color:${COLORS.ink};">${esc(b.text)}</h1>`
    case 'h2':
      return `<h2 style="margin:0 0 12px;font-family:${SERIF};font-weight:600;font-size:21px;line-height:1.3;color:${COLORS.ink};">${esc(b.text)}</h2>`
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul'
      return `<${tag} style="margin:0 0 18px;padding-left:22px;${body}">${b.items.map((i) => `<li style="margin:0 0 8px;padding-left:4px;">${esc(i)}</li>`).join('')}</${tag}>`
    }
    case 'glance':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;border-top:1px solid ${COLORS.line};"><tr>${b.items
        .map((g, i) => `<td valign="top" style="padding:16px 0 0 ${i ? '16px' : '0'};${i ? `border-left:1px solid ${COLORS.line};` : ''}"><div style="font-family:${SERIF};font-size:36px;line-height:1;color:${g.color};">${g.n}</div><div style="margin-top:6px;font-family:${SANS};font-size:13px;color:${COLORS.muted};">${esc(g.label)}</div></td>`)
        .join('')}</tr></table>`
    case 'map':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">${b.rows
        .map((r) => {
          const first = r.status === 'first'
          const mark = MARK[r.status]
          return `<tr><td width="28" style="padding:7px 0;font-size:${first ? 22 : 14}px;line-height:1;color:${mark.color};">${mark.glyph}</td><td style="padding:7px 0;font-family:${first ? SERIF : SANS};font-size:${first ? 19 : 15}px;${first ? 'font-weight:600;' : ''}color:${COLORS.ink};">${esc(r.stage)}</td><td align="right" style="padding:7px 0;font-family:${SANS};font-size:13px;${first ? 'font-weight:600;' : ''}color:${TONE[r.status]};">${esc(STATUS_LABEL[r.status])}</td></tr>`
        })
        .join('')}</table>`
    case 'arrow':
      return P(`font-family:${SERIF};font-size:19px;color:${COLORS.ink};margin-bottom:8px;`, `${esc(b.from)} <span style="color:${COLORS.gold};">&nbsp;⟶&nbsp;</span> ${esc(b.to)}`)
    case 'step':
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 10px;"><tr><td valign="top" style="padding-right:14px;font-family:${SERIF};font-size:38px;line-height:1;color:${COLORS.goldText};">${b.n}</td><td valign="middle"><div style="font-family:${SANS};font-size:16px;font-weight:600;color:${COLORS.ink};">${esc(b.title)}</div>${b.note ? `<div style="font-family:${SANS};font-size:13px;color:${COLORS.muted};">${esc(b.note)}</div>` : ''}</td></tr></table>`
    case 'answers':
      return b.items.map((i) => P(`${body}font-size:14px;color:${COLORS.muted};`, `${esc(i.question)}<br><span style="font-family:${SERIF};font-size:17px;color:${COLORS.ink};">“${esc(i.answer)}”</span>`)).join('')
    case 'buttons':
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;"><tr>${b.items
        .map((btn) => `<td style="padding:0 10px 10px 0;"><a href="${esc(btn.href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;font-family:${SANS};font-size:14px;font-weight:600;text-decoration:none;${btn.primary ? `background:${COLORS.gold};color:${COLORS.ink};` : `border:1px solid #A9C4D1;color:${COLORS.blue};`}">${esc(btn.label)}</a></td>`)
        .join('')}</tr></table>`
    case 'link':
      return P(`font-family:${SANS};font-size:14px;font-weight:600;`, `<a href="${esc(b.href)}" style="color:${COLORS.blue};text-decoration:underline;">${esc(b.label)} →</a>`)
    case 'rule':
      return `<div style="height:1px;background:${COLORS.line};margin:26px 0;line-height:1px;font-size:0;">&nbsp;</div>`
    case 'facts':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">${b.items
        .map(([k, v]) => `<tr><td valign="top" width="170" style="padding:6px 12px 6px 0;font-family:${SANS};font-size:13px;color:${COLORS.muted};">${esc(k)}</td><td style="padding:6px 0;font-family:${SANS};font-size:15px;color:${COLORS.ink};">${esc(v)}</td></tr>`)
        .join('')}</table>`
  }
}

/**
 * The email as HTML, ready to send. Pass the email tool's unsubscribe link
 * for marketing notes, for example Brevo's {{ unsubscribe }}.
 */
export function renderHtml(email: Email, unsubscribeUrl = '{{unsubscribe}}'): string {
  const why = email.id === 'team'
    ? 'Sent to the Clause & Code team for every fix plan.'
    : email.marketing
      ? `You’re getting this because you asked for occasional notes when you took the business fix plan. <a href="${esc(unsubscribeUrl)}" style="color:${COLORS.muted};">Unsubscribe</a>`
      : 'You asked for this copy when you took the business fix plan on clauseandcode.com.'
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(email.subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(email.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};"><tr><td align="center" style="padding:32px 20px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:0 0 28px;"><a href="${ORIGIN}"><img src="${ORIGIN}/logo.png" alt="Clause &amp; Code" height="36" style="display:block;height:36px;width:auto;border:0;"></a></td></tr>
<tr><td>${email.blocks.map(blockHtml).join('\n')}</td></tr>
<tr><td style="padding-top:22px;border-top:1px solid ${COLORS.line};font-family:${SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">Clause &amp; Code · <a href="${ORIGIN}" style="color:${COLORS.muted};">clauseandcode.com</a><br>${why}</td></tr>
</table></td></tr></table>
</body></html>`
}

/** The same email as plain text, sent alongside the HTML. */
export function renderText(email: Email, unsubscribeUrl = '{{unsubscribe}}'): string {
  const out: string[] = []
  for (const b of email.blocks) {
    if (b.type === 'p' || b.type === 'h1') out.push(b.text, '')
    else if (b.type === 'eyebrow') out.push(b.text.toUpperCase())
    else if (b.type === 'h2') out.push(b.text.toUpperCase(), '')
    else if (b.type === 'list') out.push(...b.items.map((i, k) => `${b.ordered ? `${k + 1}.` : '-'} ${i}`), '')
    else if (b.type === 'glance') out.push(b.items.map((g) => `${g.n} ${g.label}`).join(' · '), '')
    else if (b.type === 'map') out.push(...b.rows.map((r) => `${r.stage}: ${STATUS_LABEL[r.status]}`), '')
    else if (b.type === 'arrow') out.push(`${b.from} -> ${b.to}`)
    else if (b.type === 'step') out.push(`${b.n}. ${b.title}${b.note ? ` (${b.note.toLowerCase()})` : ''}`, '')
    else if (b.type === 'answers') out.push(...b.items.map((i) => `${i.question}\n"${i.answer}"`), '')
    else if (b.type === 'buttons') out.push(...b.items.map((i) => `${i.label}: ${i.href}`), '')
    else if (b.type === 'link') out.push(`${b.label}: ${b.href}`, '')
    else if (b.type === 'rule') out.push('---', '')
    else if (b.type === 'facts') out.push(...b.items.map(([k, v]) => `${k}: ${v}`), '')
  }
  out.push('Clause & Code · clauseandcode.com')
  if (email.marketing) out.push(`Unsubscribe: ${unsubscribeUrl}`)
  return out.join('\n')
}
