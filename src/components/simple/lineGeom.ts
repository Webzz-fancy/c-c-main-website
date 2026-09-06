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

/* ---------------------------------------------------------------------------
 * The presentation ring (from the "project section" reference): before
 * anything hangs, the ten previews stand — flat, facing the viewer — on a
 * ring around a vertical axis, at different heights, and the ring turns
 * exactly ONCE with the scroll, decelerating into its rest pose. Perspective
 * does the rest: previews grow as they pass the front and shrink at the back.
 * The rest pose is what each preview leaves from when it hops onto the line.
 * ------------------------------------------------------------------------- */

/** scroll budget for the single turn, in viewport heights */
export const SPIN_VH = 2.5

/** rest angle of each preview on the ring (deg; 0 = nearest the viewer,
 *  increasing = travelling right across the front, then round the back).
 *  Irregular on purpose, like the reference — and, with the heights and
 *  sizes below, tuned so nothing overlaps once the ring is at rest. */
export const RING_ANGLE = [0, 50, 80, 98, 155, 183, 226, 258, 292, 335]

/** height of each preview's centre on the ring, -1…1 × the ring's vertical
 *  amplitude (0 = ring centre) */
export const RING_Y = [0.9, -0.66, 0.8, 0.14, -0.75, 0.69, -0.85, 0.02, -0.53, -0.96]

/** size of each preview on the ring at unit depth, × the hung card width */
export const RING_SIZE = [0.47, 0.38, 0.45, 0.48, 0.45, 0.48, 0.42, 0.38, 0.38, 0.42]

export type RingGeom = {
  cx: number // ring axis, viewport px
  cy: number
  R: number // ring radius, px
  f: number // perspective distance (f = PERSP × R; R/f ≈ 0.35 as in the reference)
  ampY: number // vertical amplitude of the ring, px
}

/** perspective ratio: f = PERSP × R */
const PERSP = 2.85
/** the widest a preview gets on the ring, × the hung card width (RING_SIZE
 *  max × the depth factor at the front) */
const RING_MAX_W = 0.48 * (PERSP / (PERSP - 1))
/** horizontal reach of a preview's centre during the turn, × R (the extreme
 *  of sin(a) · f / (f − R·cos a)) */
const RING_REACH = 1.07
/** on mobile the ring previews are drawn at this fraction of RING_SIZE (the
 *  hung card is 46vw there — far too big for a ring) */
export const MOBILE_RING_SCALE = 0.62

/** The ring sits right of the upper-left heading block, over the line's
 *  landing area — it never runs under the text, and it clears the robot's
 *  rope on the right edge. */
export function ringGeom(vw: number, vh: number): RingGeom {
  const desk = vw >= 1024
  const cardW = lineGeom(vw).cardW
  if (desk) {
    const halfCard = 0.5 * RING_MAX_W * cardW
    // the heading block: left 7%, subline up to 560px wide (+ breathing room)
    const left = vw * 0.07 + 560 + 28
    const right = vw - 64
    let R = Math.min(vw * 0.15, vh * 0.26)
    R = Math.max(60, Math.min(R, ((right - left) / 2 - halfCard) / RING_REACH))
    const cx = Math.max(vw * 0.665, left + RING_REACH * R + halfCard)
    // vertical: the tallest front card must clear the header (top) and the
    // bottom edge; ampY is the room left over
    const cy = vh * 0.52
    const halfCardH = 0.4 * RING_MAX_W * cardW
    const roomTop = cy - 96 - halfCardH
    const roomBot = vh - 24 - cy - halfCardH
    const ampY = Math.max(0, Math.min(vh * 0.26, roomTop, roomBot) / (PERSP / (PERSP - 1)))
    return { cx, cy, R, f: R * PERSP, ampY }
  }
  // mobile: the heading is full-width at the top, so the ring sits below it,
  // smaller previews (the hung card is 46vw — far too big for a ring here)
  const R = Math.min(vw * 0.22, vh * 0.15)
  const cy = vh * 0.66
  const halfCardH = 0.4 * RING_MAX_W * cardW * MOBILE_RING_SCALE
  const roomBot = vh - 20 - cy - halfCardH
  const roomTop = cy - vh * 0.42 - halfCardH
  const ampY = Math.max(0, Math.min(vh * 0.12, roomTop, roomBot) / (PERSP / (PERSP - 1)))
  return { cx: vw * 0.5, cy, R, f: R * PERSP, ampY }
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
