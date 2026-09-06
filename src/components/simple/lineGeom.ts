/**
 * Clothesline geometry for section 3 — pure functions shared by SimplePage
 * (scroll budget + pan window) and SimpleThird (rendering), so the scroll
 * distance and the visual line always agree.
 */

export const LINE_COUNT = 10

/** the header capsule's bottom edge, px — the ring keeps clear of it */
const HEADER_CLEAR = 100

/** how far a hung card (rope offset, mid-line sag, card, label) reaches
 *  below the rope's anchor, px */
export function hangDepth(g: LineGeom) {
  return 12 + g.sag + 10 + g.cardH + 30
}

/** rope height in viewport px — low enough to sit under the spinning
 *  previews, high enough that a hung card, label included, stays inside the
 *  viewport on any screen */
export function ropeY(vw: number, vh: number) {
  const g = lineGeom(vw)
  const preferred = vh * (vw >= 1024 ? 0.66 : 0.64)
  return Math.max(vh * 0.36, Math.min(preferred, vh - 24 - hangDepth(g)))
}

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

/* ---------------------------------------------------------------------------
 * The presentation ring (from the "project section" reference): before
 * anything hangs, the ten previews stand — flat, facing the viewer — on a
 * ring around a vertical axis, at different heights, and the ring turns
 * exactly ONCE with the scroll, decelerating into its rest pose. Perspective
 * does the rest: previews grow as they pass the front and shrink at the back.
 * The rest pose is what each preview leaves from when it hops onto the line.
 * ------------------------------------------------------------------------- */

/** scroll budget for the single turn, in viewport heights */
export const SPIN_VH = 2.8

/** rest angle of each preview on the ring (deg; 0 = nearest the viewer,
 *  increasing = travelling right across the front, then round the back).
 *  Irregular on purpose, like the reference — and, with the heights and
 *  sizes below, tuned so nothing overlaps once the ring is at rest. */
export const RING_ANGLE = [0, 29, 67, 115, 140, 167, 217, 240, 289, 335]

/** height of each preview's centre on the ring, -1…1 × the ring's vertical
 *  amplitude (0 = ring centre) */
export const RING_Y = [-0.59, 1, 0.18, -0.85, -0.16, 0.91, 0.81, 0.07, 0.71, -0.97]

/** size of each preview on the ring at unit depth, × the hung card width */
export const RING_SIZE = [0.38, 0.39, 0.38, 0.38, 0.41, 0.49, 0.38, 0.38, 0.39, 0.41]

export type RingGeom = {
  cx: number // ring axis, viewport px
  cy: number
  R: number // ring radius, px
  f: number // perspective distance (f = PERSP × R; R/f ≈ 0.35 as in the reference)
  ampY: number // vertical amplitude of the ring, px
}

/** perspective ratio: f = PERSP × R */
const PERSP = 2.85
/** the widest a preview gets on the ring, × its unit-depth card width
 *  (RING_SIZE max × the depth factor at the front) */
const RING_MAX_W = 0.49 * (PERSP / (PERSP - 1))
/** horizontal reach of a preview's centre during the turn, × R (the extreme
 *  of sin(a) · f / (f − R·cos a)) */
const RING_REACH = 1.07

/** the previews on the ring are drawn at this fraction of the hung card's
 *  width (the hung card is 46vw on phones — far too big for a ring) */
export function ringScale(vw: number) {
  return vw >= 1024 ? 1 : Math.min(0.9, Math.max(0.62, vw / 960))
}

/** The ring is centred, in the band between the header and the rope: the
 *  heading has faded by the time the previews arrive, and the line waits
 *  underneath the whole cloud. It also clears the robot's rope on the right
 *  edge. */
export function ringGeom(vw: number, vh: number): RingGeom {
  const desk = vw >= 1024
  const cardW = lineGeom(vw).cardW * ringScale(vw)
  const front = PERSP / (PERSP - 1)
  const halfW = 0.5 * RING_MAX_W * cardW
  const halfH = 0.4 * RING_MAX_W * cardW
  const cx = vw * 0.5
  const room = Math.min(cx - 24, vw - (desk ? 72 : 52) - cx) - halfW
  let R = desk ? Math.min(vw * 0.19, vh * 0.34) : Math.min(vw * 0.22, vh * 0.15)
  R = Math.max(40, Math.min(R, room / RING_REACH))
  const top = HEADER_CLEAR
  const bot = ropeY(vw, vh) - 28
  const cy = (top + bot) / 2
  const ampY = Math.max(0, ((bot - top) / 2 - halfH) / front)
  return { cx, cy, R, f: R * PERSP, ampY }
}

/**
 * Scroll budget for the pinned section-3 experience, in px of scroll:
 *   dome cover → heading letters → the ring's single turn (the line draws in
 *   as it settles) → previews hop onto the line one by one → rope pan (1:1)
 *   → a short clean-orange beat before the footer arrives.
 */
export function pinBudget(vw: number, vh: number) {
  const dist = lineGeom(vw).distance
  const domeEnd = 1.4 * vh
  const headEnd = domeEnd + 1.8 * vh
  const spinEnd = headEnd + SPIN_VH * vh
  const dropEnd = spinEnd + 2.0 * vh
  const panEnd = dropEnd + dist
  const pinPx = panEnd + 0.35 * vh
  return { dist, domeEnd, headEnd, spinEnd, dropEnd, pinPx }
}
