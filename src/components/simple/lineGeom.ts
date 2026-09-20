/**
 * Section 3 geometry — pure functions shared by SimplePage (scroll budget)
 * and SimpleThird (rendering), so the scroll distance and the picture always
 * agree.
 *
 * Section 3 is a retro desktop: the orange ground is the desktop, one file
 * ("Projects.html") sits on it, and its window opens over the whole screen.
 * Inside the window the six builds turn once on a ring; when the ring has
 * come to rest, the closing line appears over it. A click on a build opens
 * it in the project sheet (the popup).
 */

export const LINE_COUNT = 6

export type Project = {
  /** the file name of the screenshot in /public/projects (without .jpg) */
  slug: string
  name: string
  tag: string
  url: string
  /** two lines about the build, for the popup */
  lines: [string, string]
  /** the site's own tone: the preview's paper while the screenshot loads,
   *  and the popup's accent */
  tint: string
  ink: string
}

/** the six Simple builds on the ring, in ring order */
export const PROJECTS: Project[] = [
  {
    slug: 'smash',
    name: 'Smash',
    tag: 'Restaurant',
    url: 'https://webzz-fancy.github.io/burger-site/',
    lines: [
      'A smash burger house told as one long sear: menu, a live build your own order, and a reservation flow.',
      'Scroll driven from the first frame, with the heat of the griddle rising as you read.',
    ],
    tint: '#1A1614',
    ink: '#E8B04B',
  },
  {
    slug: 'the-yard',
    name: 'The Yard',
    tag: 'Coffee',
    url: 'https://webzz-fancy.github.io/yard-new/',
    lines: [
      'A specialty coffee drive thru at SPARK, Sharjah: the four most loved drinks, the sweets, and the reviews.',
      'Built around the padel court next door, with a game, set, dessert rhythm to the scroll.',
    ],
    tint: '#EFE7D8',
    ink: '#2F5D3A',
  },
  {
    slug: 'dana-habayeb',
    name: 'Dana Habayeb',
    tag: 'Art gallery',
    url: 'https://art-gallery-dana.netlify.app/',
    lines: [
      'An online gallery for a contemporary artist: fifteen originals with sizes, prices and availability.',
      'Each painting opens to be looked at closely, and every original can be bought or commissioned from the page.',
    ],
    tint: '#F2EDE4',
    ink: '#1B1A17',
  },
  {
    slug: 'yaseen-faez',
    name: 'Yaseen Faez',
    tag: 'Architecture',
    url: 'https://yaseen-faez.netlify.app/',
    lines: [
      'A portfolio for an architectural engineer in Dubai: towers, villas and public work drawn from the project archive.',
      'A 360° interior walkthrough, a day to night canopy study and the full record of practice and credentials.',
    ],
    tint: '#14161A',
    ink: '#C9B58A',
  },
  {
    slug: 'alfajr',
    name: 'AlFajr',
    tag: 'Watches',
    url: 'https://alfajr-watches.netlify.app/',
    lines: [
      'An official store for prayer time watches and clocks, made since 1985: two gates, watches and clocks.',
      'The collections, the features of each line, and the time until the next Fajr on the page itself.',
    ],
    tint: '#101418',
    ink: '#D4AF37',
  },
  {
    slug: 'rashtions',
    name: 'Rashtions',
    tag: 'Food brand',
    url: 'https://rashtions.netlify.app/',
    lines: [
      'An Emirati snack built on dates and camel milk: four flavours, the six ingredients, and the bundle prices.',
      'A jar that turns over as you scroll, a cart with the discount applied on its own, and corporate gifting.',
    ],
    tint: '#F4E9DA',
    ink: '#7A4A1F',
  },
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
 * The presentation ring (from the "project section" reference): the six
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
export const RING_ANGLE = [0, 52, 118, 180, 236, 300]

/** height of each preview's centre on the ring, -1…1 × the ring's vertical
 *  amplitude (0 = ring centre) */
export const RING_Y = [-0.6, 0.95, -0.15, 0.85, -0.95, 0.3]

/** size of each preview on the ring at unit depth, × the unit card width */
export const RING_SIZE = [0.74, 0.66, 0.7, 0.66, 0.68, 0.66]

/** a preview's height, × its width (the strip + a 16:10 screen) — the
 *  ratio at the desktop's sizes; the previews are placed by it */
export const CARD_ASPECT = 0.74

/** the height a preview of width w actually renders at: its frame (1px a
 *  side), its strip (padding 3.5% of the width above and below one line of
 *  8–11px mono, and its rule) and its 16:10 screen. On desktop this is
 *  CARD_ASPECT × w; on phones the line does not shrink with the card, so
 *  the small previews are a little taller than the ratio says — the ring
 *  is fitted to this, not to the ratio */
export function ringCardH(w: number, vw: number) {
  const font = Math.min(11, Math.max(8, vw * 0.0062))
  return (w - 2) * (0.625 + 0.07) + font * 1.5 + 3
}

export type RingGeom = {
  cx: number // ring axis, viewport px
  cy: number
  R: number // ring radius, px
  f: number // perspective distance (f = PERSP × R; R/f ≈ 0.35 as in the reference)
  ampY: number // vertical amplitude of the ring, px
}

/** perspective ratio: f = PERSP × R */
const PERSP = 2.85
/** the depth factor at the front of the ring — how much larger a preview is
 *  at its nearest than at unit depth (its largest size on the ring) */
export const RING_FRONT = PERSP / (PERSP - 1)
/** the widest a preview gets on the ring, × the unit card width
 *  (RING_SIZE max × the depth factor at the front) */
const RING_MAX_W = 0.74 * RING_FRONT
/** horizontal reach of a preview's centre during the turn, × R (the extreme
 *  of sin(a) · f / (f − R·cos a)) */
const RING_REACH = 1.07

/** the unit card width the ring sizes are measured against, px */
export function ringCardW(vw: number) {
  const desk = vw >= 1024
  const base = desk ? Math.min(250, Math.max(180, vw * 0.17)) : Math.min(200, vw * 0.44)
  const scale = desk ? 1 : Math.min(0.9, Math.max(0.6, vw / 960))
  // the previews fill the window: larger than the reference's ring, which
  // turned on an open page
  return base * scale * (desk ? 1.15 : 1.3)
}

/** The ring is centred in the window's body, under the title bar, and
 *  keeps inside the window on every side. */
export function ringGeom(vw: number, vh: number): RingGeom {
  const win = windowRect(vw, vh)
  const cardW = ringCardW(vw)
  const front = RING_FRONT
  const halfW = 0.5 * RING_MAX_W * cardW
  const halfH = 0.5 * CARD_ASPECT * RING_MAX_W * cardW
  const inset = win.desk ? 28 : 14
  const cx = win.left + win.width / 2
  const top = win.top + win.bar + inset
  const bot = win.top + win.height - win.status - inset
  const cy = (top + bot) / 2
  const room = win.width / 2 - inset - halfW
  let R = win.desk ? Math.min(win.width * 0.32, vh * 0.42) : Math.min(win.width * 0.34, vh * 0.2)
  R = Math.max(40, Math.min(R, room / RING_REACH))
  // the vertical amplitude. On desktop: the largest preview, at ±1, stays
  // inside the body even as it passes the front (one bound for all six).
  // On phones the window is tall and narrow, so the ring is given as much
  // of that height as the previews allow: each preview is bounded by ITS
  // OWN size and height on the ring — the tall ones are the smaller ones,
  // so the ring spreads further than the single bound would let it, and
  // still every preview stays between the bar and the status strip for the
  // whole turn (it can never be clipped by the window's bottom edge).
  let ampY: number
  if (win.desk) {
    ampY = ((bot - top) / 2 - halfH) / front
  } else {
    const half = (bot - top) / 2
    ampY = Infinity
    for (let i = 0; i < RING_Y.length; i++) {
      const y = Math.abs(RING_Y[i])
      if (y < 0.05) continue
      // the preview at its largest (the front), about the point it is
      // placed by: CARD_ASPECT/2 of its width above, the rest of its real
      // height below
      const cw = RING_SIZE[i] * cardW * front
      const above = 0.5 * CARD_ASPECT * cw
      const below = ringCardH(cw, vw) - above
      const reach = RING_Y[i] > 0 ? below : above
      ampY = Math.min(ampY, (half - reach) / (y * front))
    }
  }
  ampY = Math.max(0, Number.isFinite(ampY) ? ampY : 0)
  return { cx, cy, R, f: R * PERSP, ampY }
}

/**
 * Scroll budget for the pinned section-3 experience, in px of scroll:
 *   the entrance — the window rises while the orange desktop is still
 *   scrolling up into view (it starts `enterLead` px BEFORE the pin, and
 *   is standing `enterEnd` px after it) → the heading rises inside the
 *   window → the ring's single turn → the ring comes to rest and the
 *   closing line appears over it → a short hold before the page moves on.
 */
export function pinBudget(_vw: number, vh: number) {
  const enterLead = 0.7 * vh
  const enterEnd = 0.15 * vh
  const headEnd = enterEnd + 0.6 * vh
  const spinEnd = headEnd + SPIN_VH * vh
  const endEnd = spinEnd + 1.5 * vh
  const pinPx = endEnd + 0.35 * vh
  return { enterLead, enterEnd, headEnd, spinEnd, endEnd, pinPx }
}
