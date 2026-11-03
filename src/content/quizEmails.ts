/**
 * The two emails that go with the business fix plan, written and rendered
 * here so the server only has to send them (see docs/quiz-backend.md).
 *
 * 1. Your fix plan: their result again, straight away, so it lives in their
 *    inbox. Everyone who asks for a copy gets it.
 * 2. One nudge, three days later, asking how the check went and inviting a
 *    reply. Only for people who ticked the box. There is no third email.
 *
 * Plus a notice to us for every plan sent. Both visitor emails are written in
 * our voice: short, warm, a bit playful, with the robot. The only thing a
 * visitor typed that appears in an email is their first name, escaped.
 */

import { site } from '../config/site'
import { AREAS, BELIEFS, MODELS, STATUS_LABEL, TEAM_SIZES, answerSummary, buildPlan, type AreaId, type Nouns, type QuizAnswers, type Status } from './quiz'

const ORIGIN = 'https://clauseandcode.com'
const absolute = (href: string) => (href.startsWith('/') ? `${ORIGIN}${href}` : href)
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** what the result of the check means, for the nudge */
const READING: Record<AreaId, (n: Nouns, solo: boolean) => string> = {
  found: () => 'If you couldn’t say where most of them came from, that’s your answer: start asking every new client from today. If you could, the biggest source is the one to protect.',
  reply: () => 'If fewer than three of the five heard back the same day, replies depend on who happens to be free. If all five did, nice. Replying is fine and the gain is somewhere else.',
  followup: () => 'The number who never heard from you after the first reply is your follow-up gap. Even two or three a month adds up to clients you never knew you lost.',
  start: (n) => `Anything you chased more than once is a gap in how work starts. Two or more across five ${n.works}, and a start checklist pays for itself in week one.`,
  info: (n) => `Count the places you had to look. More than three for one ${n.work} means it’s scattered. One or two means you’re closer than it felt.`,
  track: (n) => `Every blank you couldn’t fill without asking is a ${n.work} that could stall quietly. Filled every line? Tracking is fine and the gain is somewhere else.`,
  paid: () => 'Any gap of more than a few days between finishing and invoicing is money sitting still. Anything with no invoice at all is work done for free.',
  after: (n) => `Count the ${n.people} you never contacted again. Each one is a review, a referral or a repeat ${n.work} you didn’t ask for.`,
  owner: (_n, solo) =>
    solo
      ? 'Every task you could hand over, if the steps were written down, is page one of your manual. Start with the one you do most.'
      : 'Every question you’ve answered before is something to write down once. If most already had a written answer, your team is closer to running without you than it feels.',
}

/** A piece of an email. The renderer turns each into HTML and plain text. */
export type Block =
  | { type: 'p'; text: string; tone?: 'soft' | 'italic' | 'muted' | 'big' }
  | { type: 'image'; src: string; alt: string; width: number }
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
  id: 'plan' | 'nudge' | 'team'
  /** days after the plan was sent */
  day: number
  subject: string
  /** the grey line inboxes show after the subject */
  preheader: string
  blocks: Block[]
  /** the nudge carries an unsubscribe link; the plan and team emails don't */
  marketing: boolean
}

const COLORS = { gold: '#E1AD34', goldText: '#A97E1C', blue: '#2D6D8B', ink: '#1B1A17', soft: '#4A4740', muted: '#7A766D', line: '#E6E1D8', cream: '#F8F5F0' }

const talk = (primary: string): Block => ({
  type: 'buttons',
  items: [
    { label: primary, href: site.links.booking, primary: true },
    { label: 'Message us on WhatsApp', href: site.contact.whatsapp },
  ],
})

const signoff: Block[] = [{ type: 'p', text: 'The Clause & Code team (and the robot)', tone: 'soft' }]

/** Their plan again, straight away: the same sections as the page, in our voice. */
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
    { type: 'image', src: `${ORIGIN}/email/robot-broom.png`, alt: 'Our robot, flying in on a broom', width: 180 },
    { type: 'p', text: `Hi ${name},`, tone: 'big' },
    {
      type: 'p',
      text: p.area
        ? 'Our robot swept through your answers and found the one thing worth fixing first. Here’s your plan again, so it lives in your inbox and not just in your downloads.'
        : 'Our robot swept through your answers and, honestly, didn’t find much to sweep. Here’s your plan again, so it lives in your inbox and not just in your downloads.',
    },
    { type: 'rule' },
    ...(p.area ? [{ type: 'eyebrow', text: `Fix first: ${p.area.stage.toLowerCase()}` } as Block] : []),
    { type: 'h1', text: p.headline },
    { type: 'p', text: p.compare, tone: 'italic' },
    ...(p.tentative ? [{ type: 'p', text: 'You weren’t sure about a few answers, so treat this as a first read.', tone: 'muted' } as Block] : []),
    { type: 'glance', items: glance },
    { type: 'h2', text: 'Where things stand' },
    { type: 'map', rows: p.map },
  ]
  if (p.connection) {
    blocks.push({ type: 'h2', text: 'How one problem feeds another' }, { type: 'arrow', from: p.connection.from, to: p.connection.to }, { type: 'p', text: p.connection.line, tone: 'soft' })
  }
  blocks.push(
    { type: 'rule' },
    { type: 'h2', text: 'Why it matters' },
    { type: 'p', text: p.why },
    { type: 'rule' },
    { type: 'h2', text: 'What to do next' },
    { type: 'step', n: 1, title: 'Check it on your own records', note: 'About 20 minutes. Coffee optional.' },
    { type: 'list', items: p.check, ordered: true },
    { type: 'step', n: 2, title: 'Fix it, simplest way first' },
    { type: 'eyebrow', text: 'Start here' },
    { type: 'p', text: p.simple },
    { type: 'eyebrow', text: 'If that isn’t enough' },
    { type: 'p', text: p.bigger, tone: 'soft' },
    { type: 'link', label: p.see.label, href: absolute(p.see.href) },
  )
  if (p.evidence.length) blocks.push({ type: 'rule' }, { type: 'h2', text: 'Based on what you told us' }, { type: 'answers', items: p.evidence })
  if (p.unclear.length) blocks.push({ type: 'h2', text: 'What we couldn’t tell' }, { type: 'list', items: p.unclear })
  blocks.push(
    { type: 'rule' },
    { type: 'h2', text: 'Want a second pair of eyes?' },
    { type: 'p', text: 'This is our favourite kind of puzzle. Book a call and we’ll go through your answers with you, then tell you straight whether it needs a checklist, a better process or a system. If a checklist will do, we’ll say so.' },
    talk('Book a call'),
    ...signoff,
  )

  return {
    id: 'plan',
    day: 0,
    subject: p.area ? `${name}, your fix plan: ${lower(p.headline).replace(/\.$/, '')}` : `${name}, your fix plan is in`,
    preheader: p.area ? `Fix first: ${p.area.stage.toLowerCase()}. Plus the 20-minute check to prove it.` : 'Good news first. Then one check to keep it that way.',
    blocks,
    marketing: false,
  }
}

/** One nudge, three days later, for people who ticked the box: how did the check go? */
export function nudgeEmail(a: QuizAnswers, name: string): Email {
  const p = buildPlan(a)
  const area = p.area ?? AREAS.find((x) => x.id === BELIEFS.find((b) => b.id === a.belief)!.areas[0])!
  const stage = area.stage.toLowerCase()
  return {
    id: 'nudge',
    day: 3,
    subject: `${name}, did the check surprise you?`,
    preheader: 'Reply with what you found. We’ll tell you what we’d do next.',
    marketing: true,
    blocks: [
      { type: 'image', src: `${ORIGIN}/email/robot-leaning.png`, alt: 'Our robot, leaning in to ask', width: 110 },
      { type: 'p', text: `Hi ${name},`, tone: 'big' },
      { type: 'p', text: `Our robot has been leaning on the doorframe for three days, wondering one thing: did you run the check on ${stage}?` },
      { type: 'p', text: 'In case it slipped down the list, here it is again:' },
      { type: 'list', items: area.check(p.nouns, p.solo), ordered: true },
      { type: 'h2', text: 'What your result means' },
      { type: 'p', text: READING[area.id](p.nouns, p.solo) },
      { type: 'rule' },
      { type: 'h2', text: 'Now the fun part' },
      { type: 'p', text: 'Hit reply and tell us what you found, even if it’s one line. We’ll write back with what we’d do next. Sometimes the answer is “a checklist and you’re sorted”, and we’re happy to say that.' },
      { type: 'p', text: 'Rather talk it through? Grab a slot, or say hi on WhatsApp.' },
      talk('Book a call'),
      { type: 'p', text: 'That’s our one nudge. No more after this, promise.', tone: 'muted' },
      ...signoff,
    ],
  }
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
          ['Nudge in 3 days', lead.marketing ? 'Yes, they ticked the box' : 'No, plan email only'],
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
    case 'image':
      return `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="${b.width}" style="display:block;width:${b.width}px;max-width:100%;height:auto;border:0;margin:0 0 18px;">`
    case 'p': {
      const tone = b.tone === 'big' ? `font-family:${SERIF};font-size:22px;line-height:1.3;` : b.tone === 'italic' ? `font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.45;color:${COLORS.blue};` : b.tone === 'soft' ? `color:${COLORS.soft};` : b.tone === 'muted' ? `font-size:14px;color:${COLORS.muted};` : ''
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
      ? `You asked for one nudge when you took the business fix plan. This is it. <a href="${esc(unsubscribeUrl)}" style="color:${COLORS.muted};">Unsubscribe</a>`
      : 'You asked for this copy when you took the business fix plan on clauseandcode.com. We won’t send anything else unless you ticked the box.'
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
    else if (b.type === 'image') continue
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
