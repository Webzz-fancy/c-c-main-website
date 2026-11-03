/**
 * The pages as plain HTML — what a crawler or an AI assistant reads.
 *
 * Built into each page's HTML by scripts/prerender.mjs (inside #root, where
 * React replaces it on mount). It is the page's content in reading order:
 * the same headings, the same paragraphs, the same links, with nothing that
 * needs JavaScript. Keep it in step with the components when copy changes.
 *
 * Also the source of llms.txt.
 */
import { site } from '../config/site'
import { COMPLEX } from './complex'
import { PAGES, ORIGIN, FAQ, PORTFOLIO, absolute, type PageSeo } from '../config/seo'

export { PAGES, ORIGIN, FAQ, PORTFOLIO, absolute }
export { jsonLdFor } from '../config/seo'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const AI_URL = 'https://ai.clauseandcode.com/'

/* ---------------------------------------------------------------------------
 * copy, per page (mirrors the components)
 * ------------------------------------------------------------------------- */

const HOME = {
  h1: 'We build the operating system behind your growth.',
  intro:
    'We start with process mapping because the right solution only comes from understanding how your business actually works. Once we map your operations, we create custom systems, help you adopt the right tools, and make you ready for intelligent automation.',
  approach: {
    label: 'How We Work',
    h2: 'Our Approach',
    intro: 'We follow a clear and structured process to ensure every solution we build is relevant, practical, and sustainable.',
    steps: [
      ['Process Mapping', 'We begin by deeply mapping how your business currently operates. This includes understanding information flow, decision points, team responsibilities, and where friction exists. This step forms the foundation for everything that follows.'],
      ['Creation and Customization', 'We create custom systems and documentation built specifically around how your business works. Nothing is generic. Everything is shaped according to your actual processes and needs.'],
      ['Adoption and Implementation', 'We help you adopt the right tools and make sure they integrate properly into your operations. We provide the necessary training and support so the systems actually get used and deliver results.'],
      ['AI Readiness and Automation', 'Once your foundation is solid, we introduce intelligent automation and AI solutions. These are applied only where they create real efficiency and measurable improvement.'],
    ],
  },
  projects: {
    label: 'Our Projects',
    h2: 'Real work. Real transformation.',
    p: 'See how we have helped founders and growing businesses build scalable systems, reduce operational chaos, and create backend structures that support long term growth. Each project reflects our focus on clarity, efficiency, and sustainable systems.',
  },
  ways: {
    label: 'Work With Us',
    h2: 'Two ways to work with us',
    options: [
      ['Drop Your Problem', 'Not sure what you need? Just tell us what is not working in your business. We will review your situation and tell you exactly how we can help.'],
      ['Book a Consultation', 'A focused one on one session where we examine what is not working in your backend operations, including systems, processes, and workflows. We then start mapping a clear plan to help you scale.'],
    ],
  },
  quiz: {
    label: 'Free Check Up',
    h2: 'Take the Business Foundation Check Up Quiz',
    p: 'Find out how you are really running your business, what is working, what is messy, and what needs fixing. Built especially for founders who do it all.',
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
      ['AI discoverability & lead management', 'We put your business where people now look, in ChatGPT, Gemini and Instagram, and connect it all to your booking so every enquiry is answered.', 'Explore the AI Client Engine', AI_URL],
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

const faqHtml = (items: { q: string; a: string }[]) =>
  `<section aria-label="Frequently asked questions"><h2>Questions, answered.</h2><dl>${items
    .map(({ q, a }) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`)
    .join('')}</dl></section>`

const contactHtml = () =>
  `<footer><p>${esc(site.name)} · ${esc(site.tagline)}</p><p>Email <a href="mailto:${site.contact.email}">${site.contact.email}</a> · Phone <a href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></p><nav aria-label="Pages"><a href="/">Home</a> · <a href="/simple">Websites &amp; AI discoverability</a> · <a href="/complex">Operations &amp; custom systems</a> · <a href="${AI_URL}">AI Client Engine</a></nav></footer>`

/** The plain HTML stays in the DOM during the JS loading screen, then is
 *  removed when the matching React page is ready. Without JS it is the page:
 *  readable content, not an invisible search-only duplicate. */
const projectName = (id: string) => (id === COMPLEX.discoverability.id ? COMPLEX.discoverability.name : COMPLEX.projects.find((p) => p.id === id)?.card.name ?? id)

export function staticHtml(page: PageSeo): string {
  const open = `<div data-prerender><main>`
  const close = `</main>${contactHtml()}</div>`

  if (page === PAGES.simple) {
    return (
      open +
      `<header><p>${esc(SIMPLE.label)}</p><h1>${esc(SIMPLE.h1)}</h1>${SIMPLE.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</header>` +
      `<section id="what-we-do"><p>${esc(SIMPLE.second.label)}</p><h2>${esc(SIMPLE.second.h2)}</h2><p>${esc(SIMPLE.second.p)}</p><ol>${SIMPLE.second.offers
        .map(([t, b, cta, href]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p><a href="${href}">${esc(cta)}</a></li>`)
        .join('')}</ol></section>` +
      `<section id="projects"><p>${esc(SIMPLE.third.label)}</p><h2>${esc(SIMPLE.third.h2)}</h2><p>${esc(SIMPLE.third.p)}</p><ul>${PORTFOLIO.map(
        (p) => `<li><a href="${p.url}" rel="noopener">${esc(p.name)}</a> · ${esc(p.tag)}</li>`,
      ).join('')}</ul><p>${esc(SIMPLE.third.close)}</p></section>` +
      `<section id="contact"><p>${esc(SIMPLE.talk.label)}</p><h2>${esc(SIMPLE.talk.h2)}</h2><p>${esc(SIMPLE.talk.p)}</p></section>` +
      faqHtml(FAQ.simple) +
      close
    )
  }
  if (page === PAGES.complex) {
    return (
      open +
      `<header><p>${esc(COMPLEX.hero.label)}</p><h1>${esc(COMPLEX.hero.firstLine)} ${esc(COMPLEX.hero.secondLine)}</h1><p>${esc(COMPLEX.hero.intro)}</p></header>` +
      `<section id="agents"><p>${esc(COMPLEX.agents.label)}</p><h2>${esc(COMPLEX.agents.heading)} ${esc(COMPLEX.agents.emphasis)}</h2><p>${esc(COMPLEX.agents.intro)}</p><p>${esc(COMPLEX.agents.definition)}</p><p>${esc(COMPLEX.agents.director.name)}: ${esc(COMPLEX.agents.director.job)}.</p><ul>${COMPLEX.agents.teams
        .map((team) => `<li>${esc(team.name)}: ${esc(team.job)}</li>`)
        .join('')}</ul><h3>${esc(COMPLEX.agents.story.label)}</h3><ol>${COMPLEX.agents.story.steps
        .map((step) => `<li>${esc(step.level)}: ${esc(step.text)}</li>`)
        .join('')}</ol><h3>${esc(COMPLEX.agents.control.label)}</h3><dl>${COMPLEX.agents.control.steps
        .map((step) => `<dt>${esc(step.level)}</dt><dd>${esc(step.what)}</dd>`)
        .join('')}</dl><h3>${esc(COMPLEX.agents.setup.label)}</h3><dl>${COMPLEX.agents.setup.steps
        .map((step) => `<dt>${esc(step.step)}</dt><dd>${esc(step.what)}</dd>`)
        .join('')}</dl><h3>${esc(COMPLEX.agents.industries.intro)} your business</h3>${COMPLEX.agents.industries.items
        .map((item) => `<h4>${esc(item.label)}</h4><ul>${[...item.clients, ...item.operations].map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`)
        .join('')}</section>` +
      `<section id="complex-index"><p>${esc(COMPLEX.index.label)}</p><h2>${esc(COMPLEX.index.heading)}</h2><p>${esc(COMPLEX.index.intro)}</p><h3>${esc(COMPLEX.finder.heading)}</h3><dl>${COMPLEX.finder.needs
        .map((need) => `<dt>${esc(need.label)}</dt><dd>${esc(need.plan)} Closest projects: ${esc(need.projects.map(projectName).join(', '))}.</dd>`)
        .join('')}</dl><ol>${COMPLEX.projects
        .map(({ id, card }) => `<li><h3><a href="#project-${id}">${esc(card.name)}</a></h3><p>${esc(card.kind)} · ${esc(card.area)}</p><dl><dt>Before</dt><dd>${esc(card.before)}</dd><dt>Now</dt><dd>${esc(card.after)}</dd><dt>Who uses it</dt><dd>${esc(card.users)}</dd></dl></li>`)
        .join('')}<li><h3><a href="${COMPLEX.discoverability.url}">${esc(COMPLEX.discoverability.name)}</a></h3><p>AI discoverability · ${esc(COMPLEX.discoverability.sector)}</p><dl><dt>Before</dt><dd>${esc(COMPLEX.discoverability.before)}</dd><dt>Now</dt><dd>${esc(COMPLEX.discoverability.after)}</dd><dt>Who uses it</dt><dd>${esc(COMPLEX.discoverability.users)}</dd></dl></li></ol></section>` +
      COMPLEX.projects
        .map((project) => `<article id="project-${project.id}"><p>${esc(project.card.kind)} · ${esc(project.card.area)}</p><h2>${esc(project.card.name)}: ${esc(project.title)}</h2><p>${esc(project.lede)}</p><h3>Who uses it</h3><ul>${project.roles
          .map((role) => `<li>${esc(role.name)}: ${esc(role.access)}</li>`)
          .join('')}</ul><h3>How the work runs</h3><ol>${project.stops
          .map((stop) => `<li><h4>${esc(stop.title)}</h4><p>${esc(stop.body)}</p><p>${esc(stop.guard)}</p></li>`)
          .join('')}</ol><h3>Also built in</h3><ul>${project.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p>${esc(project.result)}</p></article>`)
        .join('') +
      `<section><p>${esc(COMPLEX.close.label)}</p><h2>${esc(COMPLEX.close.heading)}</h2><p>${esc(COMPLEX.close.body)}</p><a href="mailto:${site.contact.email}?subject=Operations%20conversation">${esc(COMPLEX.close.action)}</a></section>` +
      close
    )
  }
  return (
    open +
    `<header><h1>${esc(HOME.h1)}</h1><p>${esc(HOME.intro)}</p></header>` +
    `<section id="approach"><p>${esc(HOME.approach.label)}</p><h2>${esc(HOME.approach.h2)}</h2><p>${esc(HOME.approach.intro)}</p><ol>${HOME.approach.steps
      .map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`)
      .join('')}</ol></section>` +
    `<section id="projects"><p>${esc(HOME.projects.label)}</p><h2>${esc(HOME.projects.h2)}</h2><p>${esc(HOME.projects.p)}</p><p><a href="/simple">Websites &amp; AI discoverability</a></p><p><a href="/complex">Operations &amp; custom systems</a></p></section>` +
    `<section id="ways-we-help"><p>${esc(HOME.ways.label)}</p><h2>${esc(HOME.ways.h2)}</h2><ul>${HOME.ways.options
      .map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`)
      .join('')}</ul></section>` +
    `<section id="quiz"><p>${esc(HOME.quiz.label)}</p><h2>${esc(HOME.quiz.h2)}</h2><p>${esc(HOME.quiz.p)}</p></section>` +
    faqHtml(FAQ.home) +
    close
  )
}

/* ---------------------------------------------------------------------------
 * llms.txt — the site, for language models (llmstxt.org)
 * ------------------------------------------------------------------------- */
export function llmsTxt(): string {
  const lines = [
    `# ${site.name}`,
    ``,
    `> ${site.name} maps how a business runs, then builds the SOPs, systems and automation that let it scale without backend chaos. We also design websites and make businesses discoverable to search engines and AI assistants (ChatGPT, Gemini, Perplexity). Based in the UAE, working worldwide.`,
    ``,
    `Contact: ${site.contact.email} · ${site.contact.phone}`,
    ``,
    `## Pages`,
    ``,
    ...Object.values(PAGES)
      .filter((p) => !p.noindex)
      .map((p) => `- [${p.title.split(' | ')[0]}](${absolute(p.path)}): ${p.summary}`),
    `- [AI Client Engine](${AI_URL}): our AI discoverability and lead capture product: an AI ready landing page, your own assistant on ChatGPT, Gemini and Instagram, and connected booking, live in five working days.`,
    ``,
    `## How we work`,
    ``,
    ...HOME.approach.steps.map(([t, b], i) => `${i + 1}. ${t}: ${b}`),
    ``,
    `## Websites`,
    ``,
    `${SIMPLE.intro[0]} ${SIMPLE.intro[1]}`,
    ``,
    ...SIMPLE.second.offers.map(([t, b]) => `- ${t}: ${b}`),
    ``,
    `Recent builds: ${PORTFOLIO.map((p) => `${p.name} (${p.tag.toLowerCase()}, ${p.url})`).join('; ')}.`,
    ``,
    `## AI agent offices`,
    ``,
    `${COMPLEX.agents.heading} ${COMPLEX.agents.emphasis} ${COMPLEX.agents.intro}`,
    ``,
    `- ${COMPLEX.agents.director.name}: ${COMPLEX.agents.director.job}`,
    ...COMPLEX.agents.teams.map((team) => `- ${team.name}: ${team.job}`),
    ``,
    COMPLEX.agents.definition,
    `${COMPLEX.agents.story.label}: ${COMPLEX.agents.story.steps.map((step) => `(${step.level}) ${step.text}`).join(' ')}`,
    ``,
    `${COMPLEX.agents.control.label}: ${COMPLEX.agents.control.steps.map((step) => `${step.level}: ${step.what}`).join(' ')}`,
    ``,
    `${COMPLEX.agents.setup.label}: ${COMPLEX.agents.setup.steps.map((step) => `${step.step}: ${step.what}`).join(' ')}`,
    ``,
    `${COMPLEX.agents.industries.intro} each kind of business:`,
    ...COMPLEX.agents.industries.items.map((item) => `- ${item.label}: ${[...item.clients, ...item.operations].join('; ')}.`),
    ``,
    `## Operations and custom systems`,
    ``,
    `${COMPLEX.hero.intro} ${COMPLEX.index.intro}`,
    ``,
    `### ${COMPLEX.finder.heading}`,
    ...COMPLEX.finder.needs.map((need) => `- ${need.label}: ${need.plan} Closest projects: ${need.projects.map(projectName).join(', ')}.`),
    ``,
    ...COMPLEX.projects.flatMap((project) => [
      `### ${project.card.name} (${project.card.kind}: ${project.card.area})`,
      `- Before: ${project.card.before}`,
      `- Now: ${project.card.after}`,
      `- Who uses it: ${project.card.users}`,
      ``,
      project.lede,
      ...project.roles.map((role) => `- ${role.name}: ${role.access}`),
      ...project.stops.map((stop, i) => `${i + 1}. ${stop.title} ${stop.body} ${stop.guard}`),
      `Also built in: ${project.features.join('; ')}.`,
      `Result: ${project.result}`,
      ``,
    ]),
    ``,
    `## Frequently asked questions`,
    ``,
    ...[...FAQ.home, ...FAQ.simple].flatMap(({ q, a }) => [`### ${q}`, ``, a, ``]),
    `## Ways to work with us`,
    ``,
    ...HOME.ways.options.map(([t, b]) => `- ${t}: ${b}`),
    ``,
  ]
  return lines.join('\n')
}
