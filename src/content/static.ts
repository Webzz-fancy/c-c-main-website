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
import { CONTACT } from './contact'
import { QUIZ } from './quiz'
import { PAGES, ORIGIN, FAQ, PORTFOLIO, ENTITY, absolute, type PageSeo } from '../config/seo'

export { PAGES, ORIGIN, FAQ, PORTFOLIO, absolute }
export { jsonLdFor } from '../config/seo'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const AI_URL = 'https://ai.clauseandcode.com/'

/* ---------------------------------------------------------------------------
 * copy, per page (mirrors the components)
 * ------------------------------------------------------------------------- */

const HOME = {
  h1: 'We build the operating system behind your growth.',
  intro:
    'We start with process mapping because the right solution only comes from understanding how your business actually works. Once we map your operations, we create custom systems, help you adopt the right tools, and make you ready for intelligent automation.',
  actions: [
    ['See Our Approach', '#approach'],
    ['Book a Consultation', site.links.booking],
  ],
  approach: {
    label: 'How We Work',
    h2: 'Our Approach',
    intro: 'We follow a clear and structured process to ensure every solution we build is relevant, practical, and sustainable.',
    steps: [
      ['Process Mapping', 'We begin by deeply mapping how your business currently operates. This includes understanding information flow, decision points, team responsibilities, and where friction exists. This step forms the foundation for everything that follows.'],
      ['Creation and Customization', 'We create custom systems and documentation built specifically around how your business works. Nothing is generic. Everything is shaped according to your actual processes and needs.'],
      ['Adoption and Implementation', 'We help you adopt the right tools and make sure they integrate properly into your operations. We provide the necessary training and support so the systems actually get used and deliver results.'],
      ['AI-Readiness and Automation', 'Once your foundation is solid, we introduce intelligent automation and AI solutions. These are applied only where they create real efficiency and measurable improvement.'],
    ],
  },
  projects: {
    label: 'Our Projects',
    h2: 'Real work. Real transformation.',
    p: 'See how we have helped founders and growing businesses build scalable systems, reduce operational chaos, and create backend structures that support long-term growth. Each project reflects our focus on clarity, efficiency, and sustainable systems.',
    action: 'View Our Projects',
  },
  ways: {
    label: 'Work With Us',
    h2: 'Two ways to work with us',
    options: [
      ['Not sure where to start', 'Drop Your Problem', 'Not sure what you need? Just tell us what is not working in your business. We will review your situation and tell you exactly how we can help.', site.links.dropProblem],
      ['Ready to fix it', 'Book a Consultation', 'This is a focused one-on-one session where we examine what\u2019s not working in your backend operations, including systems, processes, and workflows. We then start mapping a clear plan to help you scale.', site.links.booking],
    ],
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
  label: 'Our Projects · Websites & AI discoverability',
  h1: 'Your website, built to a higher standard.',
  intro: [
    'A website is the front of a business. We build it with the same rigour we bring to the operations behind one.',
    'Every page has a job. Fast for the people who visit, structured for the AI that recommends, and built to keep working long after launch.',
  ],
  second: {
    label: 'What we do',
    h2: 'The website, and what brings people to it.',
    p: 'We build the website itself, and the system around it that gets it recommended by search and AI and turns interest into enquiries. Same team, same standard as the operations we build.',
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
  `<nav aria-label="Ways We Help"><p>Ways We Help</p><ul><li>${a(site.links.booking, 'Book a Consultation')}</li><li>${a(site.links.dropProblem, 'Drop Your Problem')}</li><li>${a('/#quiz', 'Business fix plan')}</li></ul></nav>` +
  `<nav aria-label="Explore"><p>Explore</p><ul><li>${a('/', 'Home')}</li><li>${a('/complex', 'Our Projects')}</li><li>${a('/contact', 'Contact')}</li></ul></nav>` +
  `<address aria-label="Contact"><p>Contact</p><ul><li>${a(`mailto:${site.contact.email}`, site.contact.email)}</li><li>${a(site.contact.whatsapp, 'Message us on WhatsApp')}</li></ul></address>` +
  `<p>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</p><p>Operations, systems &amp; AI for growing businesses.</p></footer>`

/** The plain HTML stays in the DOM during the JS loading screen, then is
 *  removed when the matching React page is ready. Without JS it is the page:
 *  readable content, not an invisible search-only duplicate. */
const projectName = (id: string) => (id === COMPLEX.discoverability.id ? COMPLEX.discoverability.name : COMPLEX.projects.find((p) => p.id === id)?.card.name ?? id)

export function staticHtml(page: PageSeo): string {
  const open = `<div data-prerender><main>`
  const close = `</main>${footerHtml()}</div>`

  if (page === PAGES.simple) {
    return (
      open +
      `<header><p>${esc(SIMPLE.label)}</p><h1>${esc(SIMPLE.h1)}</h1>${SIMPLE.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</header>` +
      `<section id="what-we-do"><p>${esc(SIMPLE.second.label)}</p><h2>${esc(SIMPLE.second.h2)}</h2><p>${esc(SIMPLE.second.p)}</p><ol>${SIMPLE.second.offers
        .map(([t, b, cta, href]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p>${a(href, cta)}</li>`)
        .join('')}</ol></section>` +
      `<section id="projects"><p>${esc(SIMPLE.third.label)}</p><h2>${esc(SIMPLE.third.h2)}</h2><p>${esc(SIMPLE.third.p)}</p><ul>${PORTFOLIO.map(
        (p) => `<li>${a(p.url, p.name)} · ${esc(p.tag)}</li>`,
      ).join('')}</ul><p>${esc(SIMPLE.third.close)}</p></section>` +
      `<section id="contact"><p>${esc(SIMPLE.talk.label)}</p><h2>${esc(SIMPLE.talk.h2)}</h2><p>${esc(SIMPLE.talk.p)}</p>${a(site.links.booking, 'Book a call')}</section>` +
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
        .map(({ id, card }) => `<li><h3>${esc(card.name)}</h3><p>${esc(card.kind)}</p><p>${esc(card.after)}</p>${a(`#project-${id}`, `${card.name}: see the details`)}</li>`)
        .join('') +
      `</ol></section>` +
      `<section id="agents" aria-labelledby="lab-title"><p>${esc(COMPLEX.agents.label)}</p><h2 id="lab-title">${esc(COMPLEX.agents.heading)} ${esc(COMPLEX.agents.emphasis)}</h2><p>${esc(COMPLEX.agents.intro)}</p><p>${esc(COMPLEX.agents.director.name)}: ${esc(COMPLEX.agents.director.job.replace(/ · /g, ', '))}.</p><ul>${COMPLEX.agents.teams
        .map((team) => `<li>${esc(team.name)}: ${esc(team.job.replace(/ · /g, ', '))}</li>`)
        .join('')}</ul><h3>${esc(COMPLEX.agents.setup.label)}</h3><dl>${COMPLEX.agents.setup.steps
        .map((step) => `<dt>${esc(step.step)}</dt><dd>${esc(step.what)}</dd>`)
        .join('')}</dl><h3>${esc(COMPLEX.agents.industries.intro)} your business</h3>${COMPLEX.agents.industries.items
        .map((item) => `<h4>${esc(item.label)}</h4><ul>${[...item.clients, ...item.operations].map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`)
        .join('')}</section>` +
      // each project's details: a dialog on the live page, opened by #project-<id>
      COMPLEX.projects
        .map((project) => `<article id="project-${project.id}" aria-labelledby="project-${project.id}-title"><p>${esc(project.card.kind)} · ${esc(project.card.area)}</p><h2 id="project-${project.id}-title">${esc(project.card.name)}</h2><p>${esc(project.title)}</p><p>${esc(project.lede)}</p><dl><dt>Before</dt><dd>${esc(project.card.before)}</dd><dt>Now</dt><dd>${esc(project.card.after)}</dd></dl><h3>Who does what</h3><ul>${project.roles
          .map((role) => `<li>${esc(role.name)}: ${esc(role.access)}</li>`)
          .join('')}</ul><h3>${esc(project.walk)}</h3><ol>${project.stops
          .map((stop) => `<li><h4>${esc(stop.title)}</h4><p>${esc(stop.body)}</p><p>${esc(stop.guard)}</p></li>`)
          .join('')}</ol><h3>Also built in</h3><ul>${project.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><h3>The result</h3><p>${esc(project.result)}</p></article>`)
        .join('') +
      `<section aria-labelledby="complex-close-title"><p>${esc(COMPLEX.close.label)}</p><h2 id="complex-close-title">${esc(COMPLEX.close.heading)}</h2><p>${esc(COMPLEX.close.body)}</p>${a(site.links.booking, COMPLEX.close.action)} <span>${esc(COMPLEX.close.quiz)}</span> ${a('/#quiz', 'Take the business quiz')}</section>` +
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
    `<section id="approach"><p>${esc(HOME.approach.label)}</p><h2>${esc(HOME.approach.h2)}</h2><p>${esc(HOME.approach.intro)}</p><ol>${HOME.approach.steps
      .map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`)
      .join('')}</ol></section>` +
    `<section id="projects"><p>${esc(HOME.projects.label)}</p><h2>${esc(HOME.projects.h2)}</h2><p>${esc(HOME.projects.p)}</p><p>${a('/complex', HOME.projects.action)}</p></section>` +
    `<section id="ways-we-help"><p>${esc(HOME.ways.label)}</p><h2>${esc(HOME.ways.h2)}</h2><ul>${HOME.ways.options
      .map(([kicker, t, b, href]) => `<li><p>${esc(kicker)}</p><h3>${esc(t)}</h3><p>${esc(b)}</p>${a(href, t)}</li>`)
      .join('')}</ul></section>` +
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
    `- Contact: email ${site.contact.email}, WhatsApp ${site.contact.whatsapp}, book a call ${site.links.booking}, or ${ORIGIN}/contact`,
    ``,
    `## Pages`,
    ``,
    ...pages.map((p) => `- [${p.name}](${absolute(p.path)}): ${p.summary}`),
    `- [AI discoverability](${AI_URL}): our AI discoverability and lead capture product: an AI ready landing page, your own assistant on ChatGPT, Gemini and Instagram, and connected booking, live in five working days.`,
    ``,
    `## Projects`,
    ``,
    `- [${COMPLEX.index.agents.name}](${ORIGIN}/complex#agents): ${md(COMPLEX.index.agents.change)}`,
    `- [${COMPLEX.discoverability.name}](${COMPLEX.discoverability.url}): ${md(COMPLEX.discoverability.after)}`,
    ...COMPLEX.projects.map((p) => `- [${p.card.name}](${ORIGIN}/complex#project-${p.id}): ${p.card.kind}. ${md(p.card.after)}`),
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
    `## How we work`,
    ``,
    HOME.intro,
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
    `## Custom systems, automation and online user experience`,
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
    `## Websites page`,
    ``,
    `${SIMPLE.intro[0]} ${SIMPLE.intro[1]}`,
    ``,
    ...SIMPLE.second.offers.map(([t, b]) => `- ${t}: ${b}`),
    ``,
    `Recent builds: ${PORTFOLIO.map((p) => `${p.name} (${p.tag.toLowerCase()}, ${p.url})`).join('; ')}.`,
    ``,
    `## Frequently asked questions`,
    ``,
    ...FAQ.flatMap(({ q, a: answer }) => [`### ${q}`, ``, answer, ``]),
    `## Ways to work with us`,
    ``,
    ...HOME.ways.options.map(([, t, b]) => `- ${t}: ${b}`),
    `- ${HOME.quiz.h2}: ${HOME.quiz.p} (${ORIGIN}/#quiz)`,
    ``,
  )
  return lines.join('\n')
}
