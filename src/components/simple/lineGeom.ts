/**
 * Clothesline geometry for section 3 — pure functions shared by SimplePage
 * (scroll budget + pan window) and SimpleThird (rendering), so the scroll
 * distance and the visual line always agree.
 */

export const LINE_COUNT = 10

/** rope height, as a fraction of the viewport height */
export const ROPE_Y = 0.56

/** fixed per-card hand-hung tilt (deg), deterministic so it never shimmers */
export const CARD_TILT = [-1.2, 0.9, -0.6, 1.3, -1.0, 0.5, -1.5, 0.8, -0.7, 1.1]

/** placeholder projects — the white card area becomes each site's hero
 *  screenshot once the real links are in. */
export const PROJECTS: { name: string; tag: string }[] = [
  { name: 'Kestrel', tag: 'Fintech' },
  { name: 'Marlowe', tag: 'Law' },
  { name: 'Ondine', tag: 'Aesthetics' },
  { name: 'Basecoat', tag: 'SaaS' },
  { name: 'Northgate', tag: 'Real estate' },
  { name: 'Folio', tag: 'Portfolio' },
  { name: 'Quanta', tag: 'AI tools' },
  { name: 'Loom & Co', tag: 'Retail' },
  { name: 'Halcyon', tag: 'Wellness' },
  { name: 'Verre', tag: 'Studio' },
]

export type LineGeom = {
  cardW: number
  cardH: number
  spacing: number // centre-to-centre between hanging cards
  margin: number // rope overhang past the first/last card
  lineW: number // full rope length
  distance: number // total horizontal pan travel (line + one viewport)
  sag: number
}

export function lineGeom(vw: number): LineGeom {
  const desk = vw >= 1024
  const cardW = desk ? Math.min(250, Math.max(180, vw * 0.17)) : Math.min(200, vw * 0.46)
  const cardH = cardW * 0.8
  const gap = desk ? Math.min(90, Math.max(56, vw * 0.045)) : Math.max(20, vw * 0.075)
  const spacing = cardW + gap
  const margin = desk ? vw * 0.08 : vw * 0.12
  const lineW = margin * 2 + (LINE_COUNT - 1) * spacing + cardW
  const distance = lineW + vw
  // a real clothesline droops — a visible mid-sag
  const sag = Math.min(64, lineW * 0.018)
  return { cardW, cardH, spacing, margin, lineW, distance, sag }
}

/**
 * Scroll budget for the pinned section-3 experience, in px of scroll:
 *   dome cover → heading letters → rope spin + card drops → rope pan (1:1)
 *   → a short clean-orange beat before the footer arrives.
 */
export function pinBudget(vw: number, vh: number) {
  const dist = lineGeom(vw).distance
  const domeEnd = 1.4 * vh
  const headEnd = domeEnd + 1.8 * vh
  const dropEnd = headEnd + 2.0 * vh
  const panEnd = dropEnd + dist
  const pinPx = panEnd + 0.35 * vh
  return { dist, domeEnd, headEnd, dropEnd, pinPx }
}
