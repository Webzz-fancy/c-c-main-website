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

const COMPLEX = {
  label: 'Category 02 · Complex',
  h1: 'Complex is next.',
  p: 'We are finishing Websites & AI discoverability first. Complex, our operations offer of SOPs, systems and automation, will open here. Check back soon.',
}

/* ---------------------------------------------------------------------------
 * html
 * ------------------------------------------------------------------------- */

const faqHtml = (items: { q: string; a: string }[]) =>
  `<section aria-label="Frequently asked questions"><h2>Questions, answered.</h2><dl>${items
    .map(({ q, a }) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`)
    .join('')}</dl></section>`

const contactHtml = () =>
  `<footer><p>${esc(site.name)} · ${esc(site.tagline)}</p><p>Email <a href="mailto:${site.contact.email}">${site.contact.email}</a> · Phone <a href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></p><nav aria-label="Pages"><a href="/">Home</a> · <a href="/simple/">Websites &amp; AI discoverability</a> · <a href="${AI_URL}">AI Client Engine</a></nav></footer>`

/** the page's content as plain HTML, hidden from sighted users only until
 *  React mounts (React replaces the whole #root) */
export function staticHtml(page: PageSeo): string {
  // the wrapper keeps the crawler copy from flashing under the loading
  // screen: it is in the document (read by crawlers) but drawn under the
  // page's cream, and React replaces it on mount
  const open = `<div data-prerender style="position:absolute;inset:0;overflow:hidden;opacity:0;pointer-events:none" aria-hidden="true"><main>`
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
    return open + `<header><p>${esc(COMPLEX.label)}</p><h1>${esc(COMPLEX.h1)}</h1><p>${esc(COMPLEX.p)}</p><a href="/simple/">See Websites &amp; AI discoverability</a></header>` + close
  }
  return (
    open +
    `<header><h1>${esc(HOME.h1)}</h1><p>${esc(HOME.intro)}</p></header>` +
    `<section id="approach"><p>${esc(HOME.approach.label)}</p><h2>${esc(HOME.approach.h2)}</h2><p>${esc(HOME.approach.intro)}</p><ol>${HOME.approach.steps
      .map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`)
      .join('')}</ol></section>` +
    `<section id="projects"><p>${esc(HOME.projects.label)}</p><h2>${esc(HOME.projects.h2)}</h2><p>${esc(HOME.projects.p)}</p><p><a href="/simple/">Websites &amp; AI discoverability</a></p></section>` +
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
