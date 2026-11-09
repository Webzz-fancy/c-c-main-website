/**
 * The pages as plain HTML — what a crawler or an AI assistant reads.
 *
 * Built into each page's HTML by scripts/prerender.mjs (in #prerender, beside
 * #root; the app removes it once the real page has mounted). It is the page's content in reading order:
 * the same headings, the same paragraphs, the same links, with nothing that
 * needs JavaScript. Keep it in step with the components when copy changes.
 *
 * Also the source of llms.txt.
 */
import { site } from '../config/site'
import { COMPLEX } from './complex'
import { TERMS } from './legal'
import { HOME_HERO, HOME_DAY, HOME_ABILITIES, HOME_WORK, HOME_APPROACH } from './home'
import { CONTACT } from './contact'
import { QUIZ } from './quiz'
import { PAGES, ALL_PAGES, ORIGIN, FAQ, PORTFOLIO, ENTITY, absolute, type PageSeo } from '../config/seo'
import { BLOG, BLOG_LIVE, BLOG_ON_HOME, POSTS, formatDate, postPath, type BlogBlock } from './blog'
import { SERVICES, type Service } from './services'
import { workPath } from './work'

export { PAGES, ALL_PAGES, ORIGIN, FAQ, PORTFOLIO, absolute }
export { jsonLdFor } from '../config/seo'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const AI_URL = 'https://ai.clauseandcode.com/'

/* ---------------------------------------------------------------------------
 * copy, per page (mirrors the components)
 * ------------------------------------------------------------------------- */

const HOME = {
  h1: `${HOME_HERO.first} ${HOME_HERO.emphasis}`,
  intro: HOME_HERO.intro,
  actions: [
    [HOME_HERO.primary.label, HOME_HERO.primary.href],
    [HOME_HERO.secondary.label, HOME_HERO.secondary.href],
  ],
  approach: {
    label: HOME_APPROACH.label,
    h2: `${HOME_APPROACH.heading} ${HOME_APPROACH.emphasis}`,
    intro: HOME_APPROACH.intro,
    steps: HOME_APPROACH.steps.map((step) => [step.title, step.body]),
  },
  quiz: {
    label: QUIZ.label,
    h2: `${QUIZ.heading} ${QUIZ.emphasis}`,
    p: QUIZ.intro,
    points: QUIZ.points,
    meta: QUIZ.meta,
  },
}

const SIMPLE = {
  label: 'Our projects · Websites & AI discoverability',
  h1: 'Your website, built to a higher standard.',
  intro: [
    'A website is the front of a business. We build it with the same rigour we bring to the operations behind one.',
    'Every page has a job. Fast for the people who visit, structured for the AI that finds you, and built to keep working long after launch.',
  ],
  second: {
    label: 'What we do',
    h2: 'The website, and what brings people to it.',
    p: 'We build the website itself, and the system around it that gets it found by search and AI and turns interest into enquiries. Same team, same standard as the operations we build.',
    offers: [
      ['Websites', 'We map who is visiting and what they came to do before a single page is designed. Then we build it fast, structured and easy to keep current.', 'See the projects', '#projects'],
      ['AI discoverability & lead management', 'We put your business where people now look, in ChatGPT, Gemini and Instagram, and connect it all to your booking so every enquiry is answered.', 'Explore AI discoverability', AI_URL],
    ],
  },
  third: {
    label: 'Our work',
    h2: 'Interactive experiences.',
    p: 'Six recent builds. Each one designed around what its visitors came to do, animated with purpose, quick to load, and structured so people and AI can find it.',
    close: 'Made to be found.',
  },
  talk: {
    label: 'Contact',
    h2: 'Ready to get your business found?',
    p: 'Treat it like a first conversation. Thirty minutes, no obligation. We get to know your business, you get an honest read on what a new website would do for it.',
  },
}

/* ---------------------------------------------------------------------------
 * html
 * ------------------------------------------------------------------------- */

/** an external link opens the way the live page opens it */
const ext = (href: string) => (/^https?:\/\//.test(href) ? ' rel="noopener"' : '')
const a = (href: string, text: string) => `<a href="${esc(href)}"${ext(href)}>${esc(text)}</a>`

const faqHtml = (items: { q: string; a: string }[]) =>
  `<section id="faq" aria-labelledby="faq-title"><p>${esc(CONTACT.faq.label)}</p><h2 id="faq-title">${esc(CONTACT.faq.heading)}</h2><dl>${items
    .map(({ q, a: answer }) => `<dt>${esc(q)}</dt><dd>${esc(answer)}</dd>`)
    .join('')}</dl></section>`

/** mirrors src/components/Footer.tsx (labels as paragraphs, so the page
 *  outline stays the page's own headings) */
const footerHtml = () =>
  `<footer><p>${esc(site.name)} · ${esc(site.tagline)}</p>` +
  `<nav aria-label="What we build"><p>What we build</p><ul>${SERVICES.filter((s) => s.path !== '/about').map((s) => `<li>${a(s.path, s.name)}</li>`).join('')}</ul></nav>` +
  `<nav aria-label="Ways we help"><p>Ways we help</p><ul><li>${a('/#ways-we-help', 'What we can do for you')}</li><li>${a(site.links.booking, 'Book a consultation')}</li><li>${a('/#quiz', 'Get your fix plan')}</li></ul></nav>` +
  `<nav aria-label="Explore"><p>Explore</p><ul><li>${a('/', 'Home')}</li><li>${a('/projects', 'Our projects')}</li>${BLOG_LIVE ? `<li>${a('/blog', 'Blog')}</li>` : ''}<li>${a('/contact', 'Contact')}</li></ul></nav>` +
  `<address aria-label="Contact"><p>Contact</p><ul><li>${a(`mailto:${site.contact.email}`, site.contact.email)}</li><li>${a(site.contact.whatsapp, 'Message us on WhatsApp')}</li></ul></address>` +
  `<p>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</p><p>${a('/privacy', 'Privacy')} · ${a('/terms', 'Terms')}</p></footer>`

/** The plain HTML stays in the DOM during the JS loading screen, then is
 *  removed when the matching React page is ready. Without JS it is the page:
 *  readable content, not an invisible search-only duplicate. */
const projectName = (id: string) => (id === COMPLEX.discoverability.id ? COMPLEX.discoverability.name : COMPLEX.projects.find((p) => p.id === id)?.card.name ?? id)

const serviceHtml = (s: Service) => {
  const projects = s.projects
    .map((id) => COMPLEX.projects.find((p) => p.id === id))
    .filter((p) => p !== undefined)
  return (
    `<header><p>${esc(s.label)}</p><h1>${esc(s.heading)} ${esc(s.emphasis)}</h1>${s.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</header>` +
    s.sections
      .map((section) => {
        const tag = section.style === 'steps' ? 'ol' : 'ul'
        return `<section><h2>${esc(section.heading)}</h2>${section.intro ? `<p>${esc(section.intro)}</p>` : ''}<${tag}>${section.items
          .map((item) => `<li>${item.title ? `<h3>${esc(item.title)}</h3>` : ''}<p>${esc(item.body)}</p></li>`)
          .join('')}</${tag}></section>`
      })
      .join('') +
    (projects.length
      ? `<section><h2>Systems we have built</h2><ul>${projects
          .map((p) => `<li><h3>${a(workPath(p), p.card.name)}</h3><p>${esc(p.card.kind)}</p><p>${esc(p.title)}</p></li>`)
          .join('')}</ul></section>`
      : '') +
    (s.portfolio ? `<section><h2>Recent builds</h2><ul>${PORTFOLIO.map((p) => `<li>${a(p.url, p.tag)}</li>`).join('')}</ul></section>` : '') +
    (s.faq.length
      ? `<section><h2>Questions people ask</h2><dl>${s.faq.map(({ q, a: answer }) => `<dt>${esc(q)}</dt><dd>${esc(answer)}</dd>`).join('')}</dl></section>`
      : '') +
    `<section><h2>${esc(s.close.heading)}</h2><p>${esc(s.close.body)}</p><p>${esc(site.consultation)}</p>${a(site.links.booking, 'Book a consultation')} ${a('/#quiz', 'Get your fix plan')}</section>`
  )
}

export function staticHtml(page: PageSeo): string {
  const open = `<div data-prerender><main>`
  const close = `</main>${footerHtml()}</div>`

  if (page.service) return open + serviceHtml(page.service) + close
  if (page.project) {
    const project = page.project
    return (
      open +
      `<article><p>${a('/projects', 'All projects')}</p><p>${esc(project.card.kind)} · ${esc(project.card.area)}</p><h1>${esc(project.card.name)}</h1><p>${esc(project.title)}</p><p>${esc(project.lede)}</p><dl><dt>Before</dt><dd>${esc(project.card.before)}</dd><dt>Now</dt><dd>${esc(project.card.after)}</dd></dl><h2>Who does what</h2><ul>${project.roles
        .map((role) => `<li>${esc(role.name)}: ${esc(role.access)}</li>`)
        .join('')}</ul><h2>${esc(project.walk)}</h2><ol>${project.stops
        .map((stop) => `<li><h3>${esc(stop.title)}</h3><p>${esc(stop.body)}</p><p>${esc(stop.guard)}</p></li>`)
        .join('')}</ol><h2>Also built in</h2><ul>${project.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><h2>The result</h2><p>${esc(project.result)}</p>${a(site.links.booking, 'Book a consultation')} ${a('/#quiz', 'Get your fix plan')}</article>` +
      close
    )
  }
  if (page === PAGES.blog) {
    return (
      open +
      `<header><p>${esc(BLOG.label)}</p><h1>${esc(BLOG.heading)} ${esc(BLOG.emphasis)}</h1><p>${esc(BLOG.intro)}</p></header>` +
      (POSTS.length
        ? `<ol>${POSTS.map((p) => `<li><p>${esc(p.topic)} · <time datetime="${p.date}">${esc(formatDate(p.date))}</time> · ${p.minutes} min read</p><h2>${a(postPath(p), p.title)}</h2><p>${esc(p.excerpt)}</p></li>`).join('')}</ol>`
        : `<p>${esc(BLOG.empty)}</p>`) +
      close
    )
  }
  if (page.post) {
    const p = page.post
    const block = (b: BlogBlock) =>
      b.type === 'h2' ? `<h2>${esc(b.text)}</h2>` : b.type === 'list' ? `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : b.type === 'quote' ? `<blockquote>${esc(b.text)}</blockquote>` : `<p>${esc(b.text)}</p>`
    return (
      open +
      `<article><p>${a('/blog', BLOG.back)}</p><p>${esc(p.topic)} · <time datetime="${p.date}">${esc(formatDate(p.date))}</time> · ${p.minutes} min read</p><h1>${esc(p.title)}</h1><p>${esc(p.excerpt)}</p>${p.body.map(block).join('')}` +
      `<aside><h2>${esc(BLOG.close.heading)}</h2><p>${esc(BLOG.close.body)}</p>${a(site.links.booking, 'Book a consultation')} ${a('/#quiz', 'Get your fix plan')}<p>${esc(site.consultation)}</p></aside></article>` +
      close
    )
  }
  if (page === PAGES.privacy) {
    return (
      open +
      `<header><p>Privacy</p><h1>The small print, plainly.</h1></header>` +
      `<section><h2>What I collect</h2><p>Your name and contact details when you send a message or request a follow-up, and the quiz answers you choose to share with us.</p></section>` +
      `<section><h2>Why</h2><p>To reply to your message or follow-up request. I do not sell your data.</p></section>` +
      `<section><h2>How long I keep it</h2><p>Only as long as needed to reply and for my own records.</p></section>` +
      `<section><h2>How to ask for it to be deleted</h2><p>Email me at ${a(`mailto:${site.contact.email}`, site.contact.email)} and I will remove it within a week.</p></section>` +
      close
    )
  }
  if (page === PAGES.terms) {
    const doc = TERMS
    return (
      open +
      `<header><p>${esc(doc.label)}</p><h1>${esc(doc.heading)} ${esc(doc.emphasis)}</h1><p>Last updated ${esc(doc.updated)}</p><p>${esc(doc.short)}</p></header>` +
      doc.sections.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.body.map((t) => `<p>${esc(t)}</p>`).join('')}</section>`).join('') +
      close
    )
  }
  if (page === PAGES.simple) {
    return (
      open +
      `<header><p>${esc(SIMPLE.label)}</p><h1>${esc(SIMPLE.h1)}</h1>${SIMPLE.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</header>` +
      `<section id="what-we-do"><p>${esc(SIMPLE.second.label)}</p><h2>${esc(SIMPLE.second.h2)}</h2><p>${esc(SIMPLE.second.p)}</p><ol>${SIMPLE.second.offers
        .map(([t, b, cta, href]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p>${a(href, cta)}</li>`)
        .join('')}</ol></section>` +
      `<section id="projects"><p>${esc(SIMPLE.third.label)}</p><h2>${esc(SIMPLE.third.h2)}</h2><p>${esc(SIMPLE.third.p)}</p><ul>${PORTFOLIO.map(
        (p) => `<li>${a(p.url, p.tag)}</li>`,
      ).join('')}</ul><p>${esc(SIMPLE.third.close)}</p></section>` +
      `<section id="contact"><p>${esc(SIMPLE.talk.label)}</p><h2>${esc(SIMPLE.talk.h2)}</h2><p>${esc(SIMPLE.talk.p)}</p>${a(site.links.booking, 'Book a consultation')}</section>` +
      close
    )
  }
  if (page === PAGES.complex) {
    return (
      open +
      // the live hero is the heading and the search; the search's ready
      // answers are listed here as the plain version of that search
      `<header id="complex-hero"><p>${esc(COMPLEX.hero.label)}</p><h1>${esc(COMPLEX.hero.firstLine)} ${esc(COMPLEX.hero.secondLine)}</h1><p>${esc(COMPLEX.hero.intro)}</p><p>${esc(COMPLEX.finder.label)}</p><dl>${COMPLEX.finder.needs
        .map((need) => `<dt>${esc(need.label)}</dt><dd>${esc(need.plan)} Closest projects: ${esc(need.projects.map(projectName).join(', '))}.</dd>`)
        .join('')}</dl></header>` +
      `<section id="complex-index" aria-labelledby="complex-index-title"><p>${esc(COMPLEX.index.label)}</p><h2 id="complex-index-title">${esc(COMPLEX.index.heading)}</h2><p>${esc(COMPLEX.index.intro)}</p><ol>` +
      `<li><h3>${esc(COMPLEX.index.agents.name)}</h3><p>${esc(COMPLEX.index.agents.kind)}</p><p>${esc(COMPLEX.index.agents.change)}</p>${a('#agents', COMPLEX.index.agents.action)}</li>` +
      `<li><h3>${esc(COMPLEX.discoverability.name)}</h3><p>${esc(COMPLEX.discoverability.kind)}</p><p>${esc(COMPLEX.discoverability.after)}</p>${a(COMPLEX.discoverability.url, `${COMPLEX.discoverability.name}: ${COMPLEX.discoverability.action.toLowerCase()}`)}</li>` +
      COMPLEX.projects
        .map((project) => `<li><h3>${esc(project.card.name)}</h3><p>${esc(project.card.kind)}</p><p>${esc(project.card.after)}</p>${a(workPath(project), `${project.card.name}: see the details`)}</li>`)
        .join('') +
      `</ol></section>` +
      `<section id="agents" aria-labelledby="lab-title"><p>${esc(COMPLEX.agents.label)}</p><h2 id="lab-title">${esc(COMPLEX.agents.heading)} ${esc(COMPLEX.agents.emphasis)}</h2><p>${esc(COMPLEX.agents.intro)}</p><p>${esc(COMPLEX.agents.director.name)}: ${esc(COMPLEX.agents.director.job.replace(/ · /g, ', '))}.</p><ul>${COMPLEX.agents.teams
        .map((team) => `<li>${esc(team.name)}: ${esc(team.job.replace(/ · /g, ', '))}</li>`)
        .join('')}</ul><h3>${esc(COMPLEX.agents.setup.label)}</h3><dl>${COMPLEX.agents.setup.steps
        .map((step) => `<dt>${esc(step.step)}</dt><dd>${esc(step.what)}</dd>`)
        .join('')}</dl><h3>${esc(COMPLEX.agents.industries.intro)} your business</h3>${COMPLEX.agents.industries.items
        .map((item) => `<h4>${esc(item.label)}</h4><ul>${[...item.clients, ...item.operations].map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`)
        .join('')}</section>` +
      // each project's full details live on its own page, at /work/<slug>
      `<section aria-labelledby="complex-close-title"><p>${esc(COMPLEX.close.label)}</p><h2 id="complex-close-title">${esc(COMPLEX.close.heading)}</h2><p>${esc(COMPLEX.close.body)}</p>${a(site.links.booking, COMPLEX.close.action)} <span>${esc(COMPLEX.close.quiz)}</span> ${a('/#quiz', 'Get your fix plan')}</section>` +
      close
    )
  }
  if (page === PAGES.contact) {
    return (
      open +
      `<header><p>${esc(CONTACT.label)}</p><h1>${esc(CONTACT.heading)} ${esc(CONTACT.emphasis)}</h1><p>${esc(CONTACT.intro)}</p></header>` +
      `<section aria-label="Ways to reach us"><ul>${CONTACT.ways
        .map((way) => `<li><h2>${esc(way.name)}</h2><p>${esc(way.body)}</p>${a(way.href, way.action)}</li>`)
        .join('')}</ul><p>${esc(CONTACT.quiz.lead)} ${a(CONTACT.quiz.href, CONTACT.quiz.action)}</p></section>` +
      faqHtml(FAQ) +
      close
    )
  }
  return (
    open +
    `<header id="home"><h1>${esc(HOME.h1)}</h1><p>${esc(HOME.intro)}</p><p>${HOME.actions.map(([t, href]) => a(href, t)).join(' ')}</p></header>` +
    `<section id="your-day"><p>${esc(HOME_DAY.label)}</p><h2>${esc(HOME_DAY.heading)} ${esc(HOME_DAY.emphasis)}</h2><p>${esc(HOME_DAY.intro)}</p><dl>${HOME_DAY.moments
      .map((m) => `<dt>${esc(m.time)}</dt><dd>${esc(HOME_DAY.off)}: ${esc(m.today)} ${esc(HOME_DAY.on)}: ${esc(m.after)} (${esc(m.who)})</dd>`)
      .join('')}</dl><p>${esc(HOME_DAY.note)}</p></section>` +
    `<section id="ways-we-help"><p>${esc(HOME_ABILITIES.label)}</p><h2>${esc(HOME_ABILITIES.heading)} ${esc(HOME_ABILITIES.emphasis)}</h2><p>${esc(HOME_ABILITIES.intro)}</p><ul>${HOME_ABILITIES.items
      .map((item) => `<li><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>${a(item.href, item.action)}</li>`)
      .join('')}</ul></section>` +
    `<section id="work"><p>${esc(HOME_WORK.label)}</p><h2>${esc(HOME_WORK.heading)} ${esc(HOME_WORK.emphasis)}</h2><p>${esc(HOME_WORK.intro)}</p><ul><li>${a('/projects#agents', COMPLEX.index.agents.name)}: ${esc(COMPLEX.index.agents.change)}</li><li>${a(AI_URL, COMPLEX.discoverability.name)}: ${esc(COMPLEX.discoverability.after)}</li>${COMPLEX.projects
      .map((p) => `<li>${a(workPath(p), p.card.name)}: ${esc(p.card.after)}</li>`)
      .join('')}</ul><p>${a(HOME_WORK.href, HOME_WORK.action)}</p></section>` +
    `<section id="approach"><p>${esc(HOME.approach.label)}</p><h2>${esc(HOME.approach.h2)}</h2><p>${esc(HOME.approach.intro)}</p><ol>${HOME.approach.steps
      .map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`)
      .join('')}</ol></section>` +
    (BLOG_ON_HOME
      ? `<section id="blog"><p>${esc(BLOG.strip.label)}</p><h2>${esc(BLOG.strip.heading)} ${esc(BLOG.strip.emphasis)}</h2><ul>${POSTS.slice(0, 3)
          .map((p) => `<li><h3>${a(postPath(p), p.title)}</h3><p>${esc(p.excerpt)}</p></li>`)
          .join('')}</ul><p>${a('/blog', BLOG.strip.action)}</p></section>`
      : '') +
    `<section id="quiz" aria-label="Business fix plan"><p>${esc(HOME.quiz.label)}</p><h2>${esc(HOME.quiz.h2)}</h2><p>${esc(HOME.quiz.p)}</p><ul>${HOME.quiz.points
      .map((t) => `<li>${esc(t)}</li>`)
      .join('')}</ul><p>${esc(HOME.quiz.meta)}</p></section>` +
    close
  )
}

/* ---------------------------------------------------------------------------
 * llms.txt — the site, for language models (llmstxt.org)
 *
 * Format: an H1 with the name, a blockquote summary, plain paragraphs and
 * lists of key facts, then H2 sections of markdown links ("## Optional" is
 * the part a model may skip). llms-full.txt is the same, with everything the
 * pages say written out in full.
 * ------------------------------------------------------------------------- */
const md = (s: string) => s.replace(/\s+/g, ' ').trim()

export function llmsTxt(full = false): string {
  const pages = Object.values(PAGES).filter((p) => !p.noindex)
  const posts = ALL_PAGES.filter((p) => p.post && !p.noindex)
  const lines = [
    `# ${site.name}`,
    ``,
    `> ${ENTITY.long}`,
    ``,
    `Key facts:`,
    ``,
    `- Name: ${site.name} (also written Clause and Code)`,
    `- What we do: business process mapping, SOPs, custom business systems, workflow automation, AI agents for small and growing businesses, AI discoverability, and websites designed around what visitors come to do`,
    `- Based in: the UAE (${ENTITY.country}); we work with businesses in the UAE and worldwide`,
    `- Languages: ${ENTITY.languages.join(' and ')}`,
    `- How we work: ${HOME.approach.steps.map(([t]) => t).join(', then ')}`,
    `- Contact: email ${site.contact.email}, [WhatsApp](${site.contact.whatsapp}), book a consultation ${site.links.booking}, or ${ORIGIN}/contact`,
    ``,
    `## Pages`,
    ``,
    ...pages.map((p) => `- [${p.name}](${absolute(p.path)}): ${p.summary}`),
    `- [AI discoverability](${AI_URL}): our AI discoverability and lead capture product: an AI ready landing page, your own assistant on ChatGPT, Gemini and Instagram, and connected booking.`,
    ...(posts.length ? [``, `## Blog`, ``, ...posts.map((p) => `- [${p.name}](${absolute(p.path)}): ${p.summary}`)] : []),
    ``,
    `## Projects`,
    ``,
    `- [${COMPLEX.index.agents.name}](${ORIGIN}/projects#agents): ${md(COMPLEX.index.agents.change)}`,
    `- [${COMPLEX.discoverability.name}](${COMPLEX.discoverability.url}): ${md(COMPLEX.discoverability.after)}`,
    ...COMPLEX.projects.map((p) => `- [${p.card.name}](${absolute(workPath(p))}): ${p.card.kind}. ${md(p.card.after)}`),
    ``,
    `## Services`,
    ``,
    ...SERVICES.filter((s) => !s.draft).map((s) => `- [${s.name}](${absolute(s.path)}): ${s.summary}`),
    ``,
  ]
  if (!full) {
    lines.push(
      `## Frequently asked questions`,
      ``,
      ...FAQ.flatMap(({ q, a: answer }) => [`### ${q}`, ``, answer, ``]),
      `## Optional`,
      ``,
      `- [Full details](${ORIGIN}/llms-full.txt): every project step by step, the AI agents for each kind of business, and how we work, in full.`,
      `- [Sitemap](${ORIGIN}/sitemap.xml): every page we want found.`,
      ``,
    )
    return lines.join('\n')
  }
  lines.push(
    `## What we can do for you`,
    ``,
    HOME.intro,
    ``,
    ...HOME_ABILITIES.items.map((item) => `- ${item.title}: ${item.body}`),
    ``,
    `## How we work`,
    ``,
    HOME.approach.intro,
    ``,
    ...HOME.approach.steps.map(([t, b], i) => `${i + 1}. ${t}: ${b}`),
    ``,
    `## AI agents`,
    ``,
    `${COMPLEX.agents.heading} ${COMPLEX.agents.emphasis} ${COMPLEX.agents.intro}`,
    ``,
    `- ${COMPLEX.agents.director.name}: ${COMPLEX.agents.director.job.replace(/ · /g, ', ')}`,
    ...COMPLEX.agents.teams.map((team) => `- ${team.name}: ${team.job.replace(/ · /g, ', ')}`),
    ``,
    `${COMPLEX.agents.control.label}:`,
    ...COMPLEX.agents.control.steps.map((step) => `- ${step.level}: ${step.what}`),
    ``,
    `${COMPLEX.agents.setup.label}: ${COMPLEX.agents.setup.steps.map((step) => `${step.step}: ${step.what}.`).join(' ')}`,
    ``,
    `${COMPLEX.agents.industries.intro} each kind of business:`,
    ...COMPLEX.agents.industries.items.map((item) => `- ${item.label}: ${[...item.clients, ...item.operations].join('; ')}.`),
    ``,
    `## Find the right work by task`,
    ``,
    ...COMPLEX.finder.needs.map((need) => `- ${need.label}: ${need.plan} Closest projects: ${need.projects.map(projectName).join(', ')}.`),
    ``,
    `## Custom systems, automation and client experience`,
    ``,
    COMPLEX.index.intro,
    ``,
    ...COMPLEX.projects.flatMap((project) => [
      `### ${project.card.name} (${project.card.kind}: ${project.card.area})`,
      ``,
      `${project.title} ${project.lede}`,
      ``,
      `- Before: ${project.card.before}`,
      `- Now: ${project.card.after}`,
      ``,
      `Who does what:`,
      ...project.roles.map((role) => `- ${role.name}: ${role.access}`),
      ``,
      `${project.walk}:`,
      ...project.stops.map((stop, i) => `${i + 1}. ${stop.title} ${stop.body} ${stop.guard}`),
      ``,
      `Also built in: ${project.features.join('; ')}.`,
      ``,
      `Result: ${project.result}`,
      ``,
    ]),
    `## Frequently asked questions`,
    ``,
    ...FAQ.flatMap(({ q, a: answer }) => [`### ${q}`, ``, answer, ``]),
    `## Not sure where to start?`,
    ``,
    `- ${HOME.quiz.h2}: ${HOME.quiz.p} (${ORIGIN}/#quiz)`,
    ``,
  )
  return lines.join('\n')
}
