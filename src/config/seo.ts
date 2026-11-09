import { site } from './site'
import { COMPLEX } from '../content/complex'
import { BLOG, BLOG_LIVE, POSTS, postBySlug, postPath, type BlogPost } from '../content/blog'
import type { ComplexProject } from '../content/complex'
import { SERVICES, serviceByPath, type Service } from '../content/services'
import { WORK, projectBySlug, workPath } from '../content/work'

/**
 * SEO + GEO — one entry per URL the site serves.
 *
 * Everything a search engine or an AI assistant reads about a page comes
 * from here: the <title>, the meta description, the canonical URL, the Open
 * Graph / Twitter card, and the JSON-LD graph. The pre-render step
 * (scripts/prerender.mjs) bakes it into each page's HTML at build time, and
 * the head manager (src/lib/head.ts) swaps it on client-side navigation, so
 * both always agree.
 *
 * Writing rules: titles under 60 characters, descriptions 140–160, plain
 * words, no hyphens (house style). Say what the business does in the words
 * people search with, and only what the pages show.
 */

export type PageSeo = {
  /** preferred URL path: root "/" or a subpage without a trailing slash */
  path: string
  /** short page name, as the navigation calls it (breadcrumbs, llms.txt) */
  name: string
  title: string
  description: string
  /** Open Graph type */
  type: 'website' | 'article'
  /** OG image path, relative to the site root (1200 × 630 PNG) */
  image: string
  imageAlt: string
  /** true for pages that should not be indexed yet */
  noindex?: boolean
  /** a short "about this page" line for llms.txt */
  summary: string
  /** a blog post: its dates, for the article schema and the sitemap */
  post?: BlogPost
  /** a service page */
  service?: Service
  /** a project's own page, at /work/<slug> */
  project?: ComplexProject
}

export const ORIGIN = site.url.replace(/\/$/, '')
export const SITE_NAME = site.name
export const DEFAULT_IMAGE = '/og/clause-and-code.png'
export const LOGO_URL = `${ORIGIN}/logo.png`

/**
 * Who we are, in one quotable paragraph. The same words go into the
 * Organization schema, llms.txt and the first FAQ answer, so every search
 * engine and AI assistant reads one consistent description of the business.
 */
export const ENTITY = {
  short: 'Clause & Code is a business systems and AI company based in the UAE.',
  long:
    'Clause & Code is a business systems and AI company based in the UAE. We map how a business actually runs, then build the SOPs, custom business systems, workflow automation and AI agents that let it scale without backend chaos. We also make businesses discoverable to search engines and AI assistants, and design websites around what visitors come to do. We work in English and Arabic, with businesses in the UAE and worldwide.',
  languages: ['English', 'Arabic'],
  country: 'United Arab Emirates',
}

export const PAGES: Record<'home' | 'simple' | 'complex' | 'contact' | 'privacy' | 'terms' | 'blog', PageSeo> = {
  home: {
    path: '/',
    name: 'Home',
    title: 'AI Agents and Business Systems in the UAE | Clause & Code',
    description:
      'AI agents that answer, follow up and report, systems that run the routine, and websites built around you. Mapped first, for UAE businesses and worldwide.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code: you run the business, we handle the mess',
    summary:
      'Company home page: one ordinary business day shown twice, before and after (a reply agent, a follow-up agent, one shared system, AI discoverability and a report agent), the four ways we put AI to work (an AI team, being found on ChatGPT and Gemini, systems that run the routine, a website that feels like meeting you), the work we have built, how we work (map how it really runs, build it around you, hand it over properly, add AI where it pays), and, for anyone not sure where to start, the business fix plan: short questions about what actually happens from the first enquiry to getting paid, and a plan that names the first thing worth fixing, shows the answers behind it, gives a check to run on your own records and the simplest fix before any system.',
  },
  simple: {
    path: '/simple',
    noindex: true,
    name: 'Websites',
    title: 'Websites and AI Discoverability | Clause & Code',
    description:
      'Websites built to a higher standard, and the system that gets them found: fast, structured sites, visible to search, ChatGPT and Gemini, every enquiry captured.',
    type: 'website',
    image: '/og/websites.png',
    imageAlt: 'Clause & Code websites: your website, built to a higher standard',
    summary:
      'Our websites and AI discoverability offer: how we build sites (mapped before design, fast, structured for people and AI), AI discoverability at ai.clauseandcode.com, and six recent interactive builds.',
  },
  complex: {
    path: '/projects',
    name: 'Our projects',
    title: 'AI Agents and Custom Business Systems | Clause & Code',
    description:
      'AI agents customised to your business, AI discoverability, custom business systems and workflow automation we have built, each shown before and after.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code: AI agents and custom systems we have built',
    summary:
      'Our projects, searchable by the task you want handled. First, AI agents customised to each business’s requirements and built for whatever work it needs. The example team shows a director agent that plans the day and checks every report, and agents for the front desk, sales, operations, reports and content, with anything sent to a client or involving money waiting for the owner’s yes. Then AI discoverability (being found when people ask ChatGPT, Gemini or Google), and the custom systems we have built, each shown as how the work ran before and what runs now: an expert matching and bidding platform, a seven-stage teacher vetting and matching system, an academy management platform in English and Arabic, a client journey platform, a mapped and automated B2B order pipeline, a quiz funnel with automated program delivery, a complete membership system, and client experience for makers, artisans, artists and brands, so the website feels like meeting the work in person: sites built around what visitors come to do (look closely, walk through, order, buy or commission), the story told as they scroll, the facts beside the work, fast and structured for search and AI.',
  },
  contact: {
    path: '/contact',
    name: 'Contact',
    title: 'Contact Clause & Code | Book a Consultation or WhatsApp',
    description:
      'Book a consultation, message us on WhatsApp or email support@clauseandcode.com about AI agents, systems or your website. We work in English and Arabic.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Contact Clause & Code',
    summary:
      'How to reach us: book a consultation on our calendar, message us on WhatsApp, or email a few lines about what is not working. Also the questions people ask us most, answered.',
  },
  privacy: {
    path: '/privacy',
    name: 'Privacy',
    title: 'Privacy Policy | Clause & Code',
    description:
      'What clauseandcode.com collects and why: no analytics or tracking cookies, only what you choose to send us. Covers this website, not client systems.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code privacy policy',
    summary: 'The privacy policy for this website only: no analytics or tracking cookies, and what happens to the details you choose to send us.',
  },
  terms: {
    path: '/terms',
    name: 'Terms',
    title: 'Terms of Use | Clause & Code',
    description:
      'The terms for using clauseandcode.com. The business fix plan is general guidance, not advice. Client work is covered by its own written agreement.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code terms of use',
    summary: 'The terms for using this website only. Client work runs on its own written agreement.',
  },
  blog: {
    path: '/blog',
    name: 'Blog',
    // kept out of search until the first post is published
    noindex: !BLOG_LIVE,
    title: 'Blog: AI Agents, Systems and Getting Found | Clause & Code',
    description:
      'Notes from the work: what we learn building AI agents, custom systems and AI discoverability for real businesses, and the small fixes that come first.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'The Clause & Code blog',
    summary: BLOG.intro,
  },
}

/** one page per post, built from the post itself */
export function postSeo(post: BlogPost): PageSeo {
  const title = `${post.title} | Clause & Code`
  return {
    path: postPath(post),
    name: post.title,
    title: title.length > 70 ? post.title : title,
    description: post.description,
    type: 'article',
    image: DEFAULT_IMAGE,
    imageAlt: post.title,
    noindex: post.draft,
    summary: post.excerpt,
    post,
  }
}

export function serviceSeo(service: Service): PageSeo {
  return {
    path: service.path,
    name: service.name,
    title: service.title,
    description: service.description,
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: `Clause & Code: ${service.name}`,
    noindex: service.draft,
    summary: service.summary,
    service,
  }
}

export function workSeo(project: ComplexProject): PageSeo {
  const work = WORK[project.id]
  return {
    path: workPath(project),
    name: project.card.name,
    title: work.title,
    description: work.description,
    type: 'article',
    image: DEFAULT_IMAGE,
    imageAlt: `${project.card.name}, built by Clause & Code`,
    summary: `${project.card.kind}. ${project.card.after}`,
    project,
  }
}

/** every URL the build writes: the fixed pages, the services, each project, then each post */
export const ALL_PAGES: PageSeo[] = [
  ...Object.values(PAGES),
  ...SERVICES.map(serviceSeo),
  ...COMPLEX.projects.map(workSeo),
  ...POSTS.map(postSeo),
]

export function pageForPath(pathname: string): PageSeo {
  const service = serviceByPath(pathname.replace(/\/$/, ''))
  if (service) return serviceSeo(service)
  const workSlug = /^\/work\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1]
  const project = workSlug ? projectBySlug(workSlug) : undefined
  if (project) return workSeo(project)
  if (pathname === '/simple' || pathname === '/simple/') return PAGES.simple
  if (pathname === '/projects' || pathname === '/projects/') return PAGES.complex
  if (pathname === '/contact' || pathname === '/contact/') return PAGES.contact
  if (pathname === '/privacy' || pathname === '/privacy/') return PAGES.privacy
  if (pathname === '/terms' || pathname === '/terms/') return PAGES.terms
  if (pathname === '/blog' || pathname === '/blog/') return PAGES.blog
  const slug = /^\/blog\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1]
  const post = slug ? postBySlug(slug) : undefined
  if (post) return postSeo(post)
  return PAGES.home
}

export function absolute(path: string): string {
  return path.startsWith('http') ? path : `${ORIGIN}${path}`
}

/* ---------------------------------------------------------------------------
 * Structured data (JSON-LD)
 * ------------------------------------------------------------------------- */

const ORG_ID = `${ORIGIN}/#organization`
const SITE_ID = `${ORIGIN}/#website`
const LOGO_ID = `${ORIGIN}/#logo`
const AI_URL = 'https://ai.clauseandcode.com/'

/** the six builds shown on the websites page, for the ItemList */
export const PORTFOLIO = [
  { name: 'Smash', tag: 'Restaurant website', url: 'https://webzz-fancy.github.io/burger-site/' },
  { name: 'The Yard', tag: 'Specialty coffee website', url: 'https://webzz-fancy.github.io/yard-new/' },
  { name: 'Dana Habayeb', tag: 'Art gallery website', url: 'https://art-gallery-dana.netlify.app/' },
  { name: 'Yaseen Faez', tag: 'Architecture portfolio website', url: 'https://yaseen-faez.netlify.app/' },
  { name: 'AlFajr', tag: 'Watch store website', url: 'https://alfajr-watches.netlify.app/' },
  { name: 'Rashtions', tag: 'Food brand website', url: 'https://rationsconcept.netlify.app/' },
]

/** the questions answered on the contact page (visible there, and marked up
 *  as FAQPage). Answer first, short and literal: this is what AI assistants
 *  quote. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What does Clause & Code do?',
    a: 'Clause & Code is a business systems and AI company based in the UAE. We map how a business actually runs, then build the SOPs, custom systems, workflow automation and AI agents that let it scale without backend chaos. We also make businesses easy to find for search engines and AI assistants, and design websites around what visitors come to do.',
  },
  {
    q: 'How does the process work?',
    a: 'Four steps: we map how the work really runs, build the agents and systems around your business, hand them over properly with training and documentation, then stay on to keep them working and add more where it saves real time.',
  },
  {
    q: 'Who is Clause & Code for?',
    a: 'Founders and growing businesses whose operations have outgrown the way they run: too much held in people’s heads, tools that do not talk to each other, and work that stalls when one person is away.',
  },
  {
    q: 'What do your AI agents do, and what needs my approval?',
    a: 'Each agent is customised to your business requirements and built for the work your team needs, for example answering enquiries, drafting proposals, chasing paperwork or writing reports, and a director agent checks their work. Anything that matters, like a message to a client or anything involving money, waits for a yes from you or your team.',
  },
  {
    q: 'Can a small business use AI agents?',
    a: 'Yes. We customise the agents to how your business works: we map how the work moves, build the agents around your tools and rules, test them beside your team, and keep them running. Our projects page shows what agents could take on for clinics, law firms, accounting firms, real estate agencies, agencies, schools, online stores and field service businesses.',
  },
  {
    q: 'What is AI discoverability?',
    a: 'Being found when people ask ChatGPT, Gemini or Google for a business like yours. We structure your site so AI systems can read and understand it, and connect your assistant on Instagram and WhatsApp to your booking so every enquiry is answered.',
  },
  {
    q: 'What custom business systems have you built?',
    a: 'An expert matching and bidding platform, a seven-stage teacher vetting and matching system, an academy management platform in English and Arabic, a client journey platform, an automated B2B order pipeline, a quiz funnel with program delivery and a complete membership system. Each one started with a map of how the work actually moved.',
  },
  {
    q: 'Do you build websites?',
    a: 'Yes. We design the whole online experience around what a visitor came to do, whether that is to look closely, walk through, order, buy or commission: the story told as they scroll, the facts beside the work, and pages that are fast and structured for search and AI. It suits makers, artisans, artists and brands whose work needs to be seen before someone buys.',
  },
  {
    q: 'Where are you based, and do you work in Arabic?',
    a: 'We are based in the UAE and work with businesses in the UAE and worldwide. We work in English and Arabic, and we have built systems that run in both.',
  },
  {
    q: 'How do I start?',
    a: 'Book a consultation on our calendar, message us on WhatsApp, or email support@clauseandcode.com. If you are not sure what you need, take the business fix plan on the home page first: short questions about how work moves through your business, and a plan for what to fix first and how to check it yourself.',
  },
]

type JsonLd = Record<string, unknown>

const AREA_SERVED = [{ '@type': 'Country', name: ENTITY.country }, 'Worldwide']

/** what the business knows, in the words people search with */
const KNOWS_ABOUT = [
  'Business process mapping',
  'Standard operating procedures (SOPs)',
  'Custom business systems',
  'Workflow automation',
  'AI agents for business',
  'AI readiness',
  'AI discoverability',
  'Generative engine optimization',
  'Lead management',
  'Website user experience',
  'Website design and development',
]

function organization(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: ['Clause and Code', 'ClauseAndCode'],
    url: `${ORIGIN}/`,
    logo: { '@type': 'ImageObject', '@id': LOGO_ID, url: LOGO_URL, contentUrl: LOGO_URL, width: 432, height: 160, caption: SITE_NAME },
    image: { '@id': LOGO_ID },
    slogan: site.tagline,
    description: ENTITY.long,
    email: site.contact.email,
    address: { '@type': 'PostalAddress', addressCountry: 'AE' },
    areaServed: AREA_SERVED,
    knowsLanguage: ['en', 'ar'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: site.contact.email,
        url: `${ORIGIN}/contact`,
        areaServed: AREA_SERVED,
        availableLanguage: ENTITY.languages,
      },
    ],
    knowsAbout: KNOWS_ABOUT,
    // add a Google Business Profile or directory listing here once it exists
    sameAs: [...Object.values(site.social).filter((u) => u.startsWith('http')), AI_URL],
  }
}

function website(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${ORIGIN}/`,
    name: SITE_NAME,
    alternateName: 'Clause and Code',
    description: ENTITY.short,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  }
}

function webPage(page: PageSeo, type = 'WebPage', extra: JsonLd = {}): JsonLd {
  const url = absolute(page.path)
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute(page.image), width: 1200, height: 630 },
    breadcrumb: { '@id': `${url}#breadcrumb` },
    inLanguage: 'en',
    ...extra,
  }
}

function service(id: string, name: string, serviceType: string, description: string, url: string): JsonLd {
  return {
    '@type': 'Service',
    '@id': id,
    name,
    serviceType,
    description,
    provider: { '@id': ORG_ID },
    areaServed: AREA_SERVED,
    url,
  }
}

function faqPage(items: { q: string; a: string }[], url: string): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    isPartOf: { '@id': `${url}#webpage` },
    inLanguage: 'en',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

function breadcrumbs(page: PageSeo): JsonLd {
  const url = absolute(page.path)
  const items = [{ name: PAGES.home.name, item: `${ORIGIN}/` }]
  if (page.post) items.push({ name: PAGES.blog.name, item: absolute(PAGES.blog.path) })
  if (page.project) items.push({ name: PAGES.complex.name, item: absolute(PAGES.complex.path) })
  if (page !== PAGES.home) items.push({ name: page.name, item: url })
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  }
}

/** the work shown on /projects, in the order the page shows it */
function projectList(url: string): JsonLd {
  const items = [
    { name: COMPLEX.index.agents.name, description: COMPLEX.index.agents.change, url: `${url}#agents` },
    { name: COMPLEX.discoverability.name, description: COMPLEX.discoverability.after, url: COMPLEX.discoverability.url },
    ...COMPLEX.projects.map((p) => ({
      name: p.card.name,
      description: `${p.card.kind}: ${p.card.after}`,
      url: absolute(workPath(p)),
    })),
  ]
  return {
    '@type': 'ItemList',
    '@id': `${url}#projects`,
    name: COMPLEX.index.heading,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'CreativeWork', name: it.name, description: it.description, url: it.url, creator: { '@id': ORG_ID } },
    })),
  }
}

export function jsonLdFor(page: PageSeo): JsonLd {
  const url = absolute(page.path)
  const graph: JsonLd[] = [organization(), website()]

  if (page.service) {
    const { service: s } = page
    graph.push(
      webPage(page, 'WebPage', { mainEntity: { '@id': `${url}#service` } }),
      service(`${url}#service`, s.name, s.serviceType, s.description, url),
      ...(s.faq.length ? [faqPage(s.faq, url)] : []),
      breadcrumbs(page),
    )
  } else if (page.project) {
    const { project } = page
    graph.push(
      webPage(page, 'WebPage', { mainEntity: { '@id': `${url}#work` } }),
      {
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        name: project.card.name,
        headline: project.title,
        description: page.description,
        genre: project.card.kind,
        about: project.card.area.replace(/ · /g, ', '),
        url,
        creator: { '@id': ORG_ID },
        inLanguage: 'en',
      },
      breadcrumbs(page),
    )
  } else if (page === PAGES.home) {
    graph.push(
      webPage(page),
      {
        ...service(
          `${url}#operations`,
          'Process mapping, SOPs, custom systems and automation',
          'Business process mapping, SOPs, custom business systems, workflow automation and AI readiness',
          'We map how your business currently operates, create custom systems and documentation around it, help your team adopt them, then introduce automation and AI where it creates real efficiency.',
          url,
        ),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our approach',
          itemListElement: [
            ['Process Mapping', 'Mapping information flow, decision points, team responsibilities and where friction exists.'],
            ['Creation and Customization', 'Custom systems and documentation (SOPs) built around how the business works.'],
            ['Adoption and Implementation', 'The right tools, integrated into operations, with training and support.'],
            ['AI Readiness and Automation', 'Automation and AI applied where they create real efficiency.'],
          ].map(([name, description]) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name, description, provider: { '@id': ORG_ID } },
          })),
        },
      },
      breadcrumbs(page),
    )
  } else if (page === PAGES.simple) {
    graph.push(
      webPage(page),
      service(
        `${url}#websites`,
        'Website design and development',
        'Website design and development',
        'Websites mapped around who visits and what they came to do, fast, structured for search and AI, and easy to keep current.',
        url,
      ),
      service(
        `${url}#ai-discoverability`,
        'AI discoverability and lead management',
        'AI discoverability, generative engine optimization and lead capture',
        'Putting a business where people now look, in ChatGPT, Gemini and Instagram, and connecting it to booking so every enquiry is answered.',
        AI_URL,
      ),
      {
        '@type': 'ItemList',
        '@id': `${url}#portfolio`,
        name: 'Recent builds',
        itemListOrder: 'https://schema.org/ItemListUnordered',
        numberOfItems: PORTFOLIO.length,
        itemListElement: PORTFOLIO.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'CreativeWork', name: p.tag, url: p.url, creator: { '@id': ORG_ID } },
        })),
      },
      breadcrumbs(page),
    )
  } else if (page === PAGES.complex) {
    const website = COMPLEX.projects.find((p) => p.group === 'websites')
    graph.push(
      webPage(page, 'CollectionPage', { mainEntity: { '@id': `${url}#projects` } }),
      service(
        `${url}#ai-agents-service`,
        'Custom AI agents for businesses',
        'AI agents for small and growing businesses',
        `${COMPLEX.agents.intro} A director agent plans the day and checks every report; anything sent to a client or involving money waits for your yes.`,
        absolute('/ai-agents'),
      ),
      service(
        `${url}#ai-discoverability`,
        'AI discoverability',
        'AI discoverability and generative engine optimization',
        COMPLEX.discoverability.after,
        COMPLEX.discoverability.url,
      ),
      service(
        `${url}#custom-systems`,
        'Custom business systems',
        'Business process mapping, custom business systems and workflow design',
        COMPLEX.index.intro,
        absolute('/custom-business-systems'),
      ),
      service(
        `${url}#workflow-automation`,
        'Workflow automation and funnels',
        'Workflow automation',
        'Order pipelines, quiz funnels with program delivery, and membership systems, mapped first and automated so each step moves on to the next person by itself.',
        absolute('/workflow-automation'),
      ),
      ...(website
        ? [
            service(
              `${url}#client-experience`,
              'Client experience',
              'Websites that carry the in-person experience online, for makers, artisans, artists and brands',
              website.card.after,
              absolute(workPath(website)),
            ),
          ]
        : []),
      projectList(url),
      breadcrumbs(page),
    )
  } else if (page === PAGES.contact) {
    graph.push(
      webPage(page, 'ContactPage', { mainEntity: { '@id': ORG_ID }, hasPart: { '@id': `${url}#faq` } }),
      faqPage(FAQ, url),
      breadcrumbs(page),
    )
  } else if (page === PAGES.blog) {
    graph.push(
      webPage(page, 'CollectionPage', { mainEntity: { '@id': `${url}#blog` } }),
      {
        '@type': 'Blog',
        '@id': `${url}#blog`,
        name: `${SITE_NAME} blog`,
        url,
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
        blogPost: POSTS.filter((p) => !p.draft).map((p) => ({ '@id': `${absolute(postPath(p))}#article` })),
      },
      breadcrumbs(page),
    )
  } else if (page.post) {
    const { post } = page
    graph.push(
      webPage(page, 'WebPage', { mainEntity: { '@id': `${url}#article` } }),
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.description,
        url,
        mainEntityOfPage: { '@id': `${url}#webpage` },
        image: absolute(page.image),
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        isPartOf: { '@id': `${absolute(PAGES.blog.path)}#blog` },
        articleSection: post.topic,
        timeRequired: `PT${post.minutes}M`,
        inLanguage: 'en',
      },
      breadcrumbs(page),
    )
  } else {
    graph.push(webPage(page), breadcrumbs(page))
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
