import { absolute, jsonLdFor, SITE_NAME, type PageSeo } from '../config/seo'

/**
 * Document head manager.
 *
 * The build pre-renders every page's head (see scripts/prerender.mjs), so a
 * crawler or an AI agent fetching the URL gets the right title, description,
 * canonical, social card and JSON-LD without running any JavaScript. This
 * module keeps that head correct after client-side navigation between the
 * home page and the project pages: it rewrites the same tags in place, so
 * there is never a duplicate.
 */

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applyHead(page: PageSeo) {
  const url = absolute(page.path)
  const image = absolute(page.image)

  document.title = page.title
  upsertMeta('name', 'description', page.description)
  upsertMeta('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1')
  upsertLink('canonical', url)

  upsertMeta('property', 'og:type', page.type)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:locale', 'en_US')
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:title', page.title)
  upsertMeta('property', 'og:description', page.description)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:image:alt', page.imageAlt)
  upsertMeta('property', 'og:image:width', '1200')
  upsertMeta('property', 'og:image:height', '630')

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', page.title)
  upsertMeta('name', 'twitter:description', page.description)
  upsertMeta('name', 'twitter:image', image)
  upsertMeta('name', 'twitter:image:alt', page.imageAlt)

  let ld = document.getElementById('cc-jsonld') as HTMLScriptElement | null
  if (!ld) {
    ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.id = 'cc-jsonld'
    document.head.appendChild(ld)
  }
  ld.textContent = JSON.stringify(jsonLdFor(page))
}
