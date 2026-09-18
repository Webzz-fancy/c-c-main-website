import { site } from './site'

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
 * words, no hyphens (house style), the brand name last.
 */

export type PageSeo = {
  /** the URL path, with a trailing slash for sub pages ("/", "/simple/") */
  path: string
  title: string
  description: string
  /** Open Graph type */
  type: 'website' | 'article'
  /** OG image path, relative to the site root */
  image: string
  imageAlt: string
  /** true for pages that should not be indexed yet */
  noindex?: boolean
  /** a short "about this page" line for llms.txt */
  summary: string
}

export const ORIGIN = site.url.replace(/\/$/, '')
export const SITE_NAME = site.name
export const DEFAULT_IMAGE = '/og/clause-and-code.png'
export const LOGO_URL = `${ORIGIN}/logo.png`

export const PAGES: Record<'home' | 'simple' | 'complex', PageSeo> = {
  home: {
    path: '/',
    title: 'Clause & Code | Systems, SOPs and Automation for Growth',
    description:
      'Clause & Code maps how your business runs, then builds the SOPs, systems and automation that let it scale without backend chaos. From mapping to AI readiness.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code: we build the operating system behind your growth',
    summary:
      'Company home page: our four step approach (process mapping, creation and customization, adoption and implementation, AI readiness and automation), how to work with us, and the free business foundation check up.',
  },
  simple: {
    path: '/simple/',
    title: 'Websites and AI Discoverability | Clause & Code',
    description:
      'Websites built to a higher standard, and the system that gets them found: fast, structured sites, visible to search, ChatGPT and Gemini, every enquiry captured.',
    type: 'website',
    image: '/og/websites.png',
    imageAlt: 'Clause & Code websites: your website, built to a higher standard',
    summary:
      'Our websites and AI discoverability offer: how we build sites (mapped before design, fast, structured for people and AI), the AI Client Engine at ai.clauseandcode.com, and six recent interactive builds.',
  },
  complex: {
    path: '/complex/',
    title: 'Operations, SOPs, Systems and Automation | Clause & Code',
    description:
      'The operations side of Clause & Code: process mapping, SOPs, custom systems and automation for businesses that have outgrown how they run. Opening soon.',
    type: 'website',
    image: DEFAULT_IMAGE,
    imageAlt: 'Clause & Code: operations, SOPs, systems and automation',
    noindex: true,
    summary: 'Placeholder for the operations offer (SOPs, systems, automation). Not yet open.',
  },
}

export function pageForPath(pathname: string): PageSeo {
  if (pathname.startsWith('/simple')) return PAGES.simple
  if (pathname.startsWith('/complex')) return PAGES.complex
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

/** the six builds shown on the websites page, for the ItemList */
export const PORTFOLIO = [
  { name: 'Smash', tag: 'Restaurant website', url: 'https://webzz-fancy.github.io/burger-site/' },
  { name: 'The Yard', tag: 'Specialty coffee website', url: 'https://webzz-fancy.github.io/yard-new/' },
  { name: 'Dana Habayeb', tag: 'Art gallery website', url: 'https://art-gallery-dana.netlify.app/' },
  { name: 'Yaseen Faez', tag: 'Architecture portfolio website', url: 'https://yaseen-faez.netlify.app/' },
  { name: 'AlFajr', tag: 'Watch store website', url: 'https://alfajr-watches.netlify.app/' },
  { name: 'Rashtions', tag: 'Food brand website', url: 'https://rashtions.netlify.app/' },
]

/** the FAQ we answer on the pages (kept short and literal: this is what AI
 *  assistants quote) */
export const FAQ: Record<'home' | 'simple', { q: string; a: string }[]> = {
  home: [
    {
      q: 'What does Clause & Code do?',
      a: 'Clause & Code maps how a business actually runs, then builds the SOPs, custom systems and automation that let it scale without backend chaos. We also build websites and make businesses discoverable to search engines and AI assistants.',
    },
    {
      q: 'How does the process work?',
      a: 'Four steps: process mapping, creation and customization of systems and documentation, adoption and implementation with training, and finally AI readiness and automation where it creates real efficiency.',
    },
    {
      q: 'Who is Clause & Code for?',
      a: 'Founders and growing businesses whose operations have outgrown the way they run: too much held in people\u2019s heads, tools that do not talk to each other, and work that stalls when one person is away.',
    },
    {
      q: 'How do I start?',
      a: 'Book a consultation, or drop your problem in a few lines and we will tell you exactly how we can help. There is also a free Business Foundation Check Up quiz on the home page.',
    },
  ],
  simple: [
    {
      q: 'What kind of websites does Clause & Code build?',
      a: 'Fast, structured websites designed around what visitors came to do. Each site is mapped before it is designed, built to load quickly, animated with purpose, and structured so both people and AI systems can find and understand it.',
    },
    {
      q: 'What is AI discoverability?',
      a: 'Being present where people now look: ChatGPT, Gemini and Instagram, as well as search. We structure your site so AI systems can read and recommend it, and connect those channels to your booking so every enquiry is answered.',
    },
    {
      q: 'What is the AI Client Engine?',
      a: 'A connected client system installed in five working days: an AI ready landing page, your own AI assistant on ChatGPT, Gemini and Instagram, and booking connected to your calendar. Details at ai.clauseandcode.com.',
    },
    {
      q: 'Can I see examples?',
      a: 'Yes. The websites page shows six recent builds, including a restaurant, a specialty coffee drive thru, an art gallery, an architecture portfolio, a watch store and a food brand. Each opens to the live site.',
    },
  ],
}

type JsonLd = Record<string, unknown>

function organization(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${ORIGIN}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 432, height: 160 },
    image: absolute(DEFAULT_IMAGE),
    slogan: site.tagline,
    description: site.description,
    email: site.contact.email,
    telephone: site.contact.phone,
    areaServed: ['AE', 'Worldwide'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: site.contact.email,
        telephone: site.contact.phone,
        availableLanguage: ['English', 'Arabic'],
      },
    ],
    knowsAbout: [
      'Business process mapping',
      'Standard operating procedures',
      'Business systems and automation',
      'AI readiness',
      'Website design and development',
      'AI discoverability',
      'Generative engine optimization',
      'Lead management',
    ],
  }
}

function website(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${ORIGIN}/`,
    name: SITE_NAME,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  }
}

function webPage(page: PageSeo, extra: JsonLd = {}): JsonLd {
  const url = absolute(page.path)
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute(page.image) },
    inLanguage: 'en',
    ...extra,
  }
}

function faqPage(items: { q: string; a: string }[], url: string): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

function breadcrumbs(page: PageSeo): JsonLd {
  const items = [{ name: 'Home', item: `${ORIGIN}/` }]
  if (page !== PAGES.home) items.push({ name: page.title.split(' | ')[0], item: absolute(page.path) })
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  }
}

export function jsonLdFor(page: PageSeo): JsonLd {
  const url = absolute(page.path)
  const graph: JsonLd[] = [organization(), website()]

  if (page === PAGES.home) {
    graph.push(
      webPage(page),
      {
        '@type': 'Service',
        '@id': `${url}#operations`,
        name: 'Operations systems, SOPs and automation',
        serviceType: 'Business process mapping, SOPs, custom systems, automation and AI readiness',
        provider: { '@id': ORG_ID },
        areaServed: ['AE', 'Worldwide'],
        url,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'How we work',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Process Mapping' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Creation and Customization' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Adoption and Implementation' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AI Readiness and Automation' } },
          ],
        },
      },
      faqPage(FAQ.home, url),
      breadcrumbs(page),
    )
  } else if (page === PAGES.simple) {
    graph.push(
      webPage(page),
      {
        '@type': 'Service',
        '@id': `${url}#websites`,
        name: 'Website design and development',
        serviceType: 'Website design and development',
        provider: { '@id': ORG_ID },
        areaServed: ['AE', 'Worldwide'],
        url,
      },
      {
        '@type': 'Service',
        '@id': `${url}#ai-discoverability`,
        name: 'AI discoverability and lead management',
        serviceType: 'AI discoverability, generative engine optimization and lead capture',
        provider: { '@id': ORG_ID },
        areaServed: ['AE', 'Worldwide'],
        url: 'https://ai.clauseandcode.com/',
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#portfolio`,
        name: 'Recent builds',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: PORTFOLIO.length,
        itemListElement: PORTFOLIO.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'CreativeWork', name: p.name, description: p.tag, url: p.url, creator: { '@id': ORG_ID } },
        })),
      },
      faqPage(FAQ.simple, url),
      breadcrumbs(page),
    )
  } else {
    graph.push(webPage(page), breadcrumbs(page))
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
