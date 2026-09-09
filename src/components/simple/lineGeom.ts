/**
 * Section 3 geometry — pure functions shared by SimplePage (scroll budget)
 * and SimpleThird (rendering), so the scroll distance and the picture always
 * agree.
 *
 * Section 3 is a retro desktop: the orange ground is the desktop, one file
 * ("Projects.html") sits on it, and its window opens over the whole screen.
 * Inside the window the ten builds turn once on a ring; when the ring has
 * come to rest, the closing line appears over it.
 */

export const LINE_COUNT = 10

export type Project = { name: string; tag: string; tint: string; ink: string }

/** placeholder projects — each preview becomes the site's hero screenshot
 *  once the real links are in; until then an abstract page in its own tone */
export const PROJECTS: Project[] = [
  { name: 'Kestrel', tag: 'Fintech', tint: '#DCE7EE', ink: '#2D6D8B' },
  { name: 'Marlowe', tag: 'Law', tint: '#EFE6D6', ink: '#7C591A' },
  { name: 'Ondine', tag: 'Aesthetics', tint: '#F3E4E0', ink: '#A6613F' },
  { name: 'Basecoat', tag: 'SaaS', tint: '#E4E9F2', ink: '#3B4E7A' },
  { name: 'Northgate', tag: 'Real estate', tint: '#E8E6DF', ink: '#4A4740' },
  { name: 'Folio', tag: 'Portfolio', tint: '#F6EAD2', ink: '#C9962A' },
  { name: 'Quanta', tag: 'AI tools', tint: '#E1ECEA', ink: '#2F6F66' },
  { name: 'Loom & Co', tag: 'Retail', tint: '#F1E3D3', ink: '#9A6A3A' },
  { name: 'Halcyon', tag: 'Wellness', tint: '#E6EEE3', ink: '#4F7A4E' },
  { name: 'Verre', tag: 'Studio', tint: '#ECEAF0', ink: '#5B5570' },
]

/* ---------------------------------------------------------------------------
 * The window
 * ------------------------------------------------------------------------- */

export type WindowRect = {
  left: number
  top: number
  width: number
  height: number
  /** title bar height */
  bar: number
  /** status bar height (bottom) */
  status: number
  /** body padding (the heading's inset) */
  pad: number
  desk: boolean
}

/** the window's place on the screen, viewport px: centred horizontally
 *  (the side margins keep clear of the hanging rope on the right edge);
 *  on desktop it hangs under the header capsule, on phones it is centred
 *  vertically as well (the top margin clears the capsule, the bottom
 *  matches it). */
export function windowRect(vw: number, vh: number): WindowRect {
  const desk = vw >= 1024
  const left = desk ? 72 : 12
  const right = desk ? 72 : 12
  const top = desk ? 104 : 96
  const bottom = desk ? 32 : 96
  return {
    left,
    top,
    width: vw - left - right,
    height: vh - top - bottom,
    bar: desk ? 44 : 40,
    status: desk ? 30 : 28,
    pad: desk ? Math.min(56, Math.max(32, vw * 0.035)) : 20,
    desk,
  }
}

/* ---------------------------------------------------------------------------
 * The presentation ring (from the "project section" reference): the ten
 * previews stand — flat, facing the viewer — on a ring around a vertical
 * axis, at different heights, and the ring turns exactly ONCE with the
 * scroll, decelerating into its rest pose. Perspective does the rest:
 * previews grow as they pass the front and shrink at the back.
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

/** size of each preview on the ring at unit depth, × the unit card width */
export const RING_SIZE = [0.38, 0.39, 0.38, 0.38, 0.41, 0.49, 0.38, 0.38, 0.39, 0.41]

/** a preview's height, × its width (the strip + a 3:2 screen) */
export const CARD_ASPECT = 0.78

export type RingGeom = {
  cx: number // ring axis, viewport px
  cy: number
  R: number // ring radius, px
  f: number // perspective distance (f = PERSP × R; R/f ≈ 0.35 as in the reference)
  ampY: number // vertical amplitude of the ring, px
}

/** perspective ratio: f = PERSP × R */
const PERSP = 2.85
/** the widest a preview gets on the ring, × the unit card width
 *  (RING_SIZE max × the depth factor at the front) */
const RING_MAX_W = 0.49 * (PERSP / (PERSP - 1))
/** horizontal reach of a preview's centre during the turn, × R (the extreme
 *  of sin(a) · f / (f − R·cos a)) */
const RING_REACH = 1.07

/** the unit card width the ring sizes are measured against, px */
export function ringCardW(vw: number) {
  const desk = vw >= 1024
  const base = desk ? Math.min(250, Math.max(180, vw * 0.17)) : Math.min(200, vw * 0.46)
  const scale = desk ? 1 : Math.min(0.9, Math.max(0.62, vw / 960))
  // the previews fill the window: larger than the reference's ring, which
  // turned on an open page
  return base * scale * (desk ? 1.15 : 1.3)
}

/** The ring is centred in the window's body, under the title bar, and
 *  keeps inside the window on every side. */
export function ringGeom(vw: number, vh: number): RingGeom {
  const win = windowRect(vw, vh)
  const cardW = ringCardW(vw)
  const front = PERSP / (PERSP - 1)
  const halfW = 0.5 * RING_MAX_W * cardW
  const halfH = 0.5 * CARD_ASPECT * RING_MAX_W * cardW
  const inset = win.desk ? 28 : 14
  const cx = win.left + win.width / 2
  const top = win.top + win.bar + inset
  const bot = win.top + win.height - win.status - inset
  const cy = (top + bot) / 2
  const room = win.width / 2 - inset - halfW
  let R = win.desk ? Math.min(win.width * 0.32, vh * 0.42) : Math.min(win.width * 0.3, vh * 0.16)
  R = Math.max(40, Math.min(R, room / RING_REACH))
  const ampY = Math.max(0, ((bot - top) / 2 - halfH) / front)
  return { cx, cy, R, f: R * PERSP, ampY }
}

/**
 * Scroll budget for the pinned section-3 experience, in px of scroll:
 *   the entrance (section 2's copy leaves, the ground turns orange, the
 *   file appears and its window opens) → the heading rises inside the
 *   window → the ring's single turn → the ring comes to rest and the
 *   closing line appears over it → a short hold before the page moves on.
 */
export function pinBudget(_vw: number, vh: number) {
  const enterEnd = 1.5 * vh
  const headEnd = enterEnd + 1.7 * vh
  const spinEnd = headEnd + SPIN_VH * vh
  const endEnd = spinEnd + 1.5 * vh
  const pinPx = endEnd + 0.35 * vh
  return { enterEnd, headEnd, spinEnd, endEnd, pinPx }
}
