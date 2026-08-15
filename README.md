# Clause & Code — Header + Hero

React + TypeScript + Vite + Tailwind CSS. Only the **header and hero section** are built.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

```
public/logo.png                horizontal wordmark, trimmed (432 x 160)
public/favicon.ico             16/32/48 multi-size icon
public/apple-touch-icon.png    180 x 180 iOS home-screen icon
public/robot-head.png          cropped/trimmed robot artwork (554 x 394)
src/
  components/
    Approach.tsx               glass panel, sticky heading, animated zig-zag line
    Projects.tsx               looping robot + copy, draw-on-view underline
    Underline.tsx              reusable self-drawing SVG underline
    WaysToWork.tsx             two equal-height glass option cards
    Eyebrow.tsx                shared uppercase section kicker (no capsule)
    Quiz.tsx                   glass panel + self-drawing question mark
    Footer.tsx                 navy footer, link groups, socials
    Header.tsx                 fixed header, transparent -> white capsule on scroll
    Hero.tsx                   full-viewport hero, centred content, robot at bottom
    RobotHead.tsx              eye tracking, head tilt, nod animation
    BlueDotCursor.tsx          blue dot cursor + trailing halo
  context/
    RobotMood.tsx              shared 'idle' | 'surprised' | 'happy' face state
  config/
    site.ts                    contact details, links, env-driven URLs
  hooks/
    usePointer.ts              ref-based pointer tracking, damp()/clamp() helpers
    useScrolled.ts             scroll threshold state
    useReveal.ts               one-shot reveal-on-scroll (respects reduced motion)
```

## Behaviour notes

- **Header** — transparent at the top; past 20px of scroll it becomes a white
  capsule with a shadow, inset exactly **50px** from each side, animated with a
  500ms `cubic-bezier(0.16, 1, 0.3, 1)` transition. "Ways We Help" opens a
  hover dropdown (with a small close delay so the pointer can travel into it).
- **Hero** — `h-screen`, content centred on both axes, robot pinned to the
  bottom centre. Type and spacing use `clamp()` against `vh` so the robot never
  overlaps the text on short viewports.
- **Robot** — the face (yellow oval eyes, pupils, smile) is an SVG overlay
  mapped to the artwork's intrinsic coordinate system, so it stays aligned at
  any size. A single `requestAnimationFrame` loop drives everything with
  frame-rate-independent damping (`damp()`), reading the pointer from a ref so
  there are **no React re-renders** during animation:
  - pupils track the cursor (±9px / ±8px inside each eye),
  - the whole head rolls ±9° and pitches slightly toward the cursor,
  - the head is sized to `min(46vh, width-fit)` so the black screen is never
    clipped, and sits flush with the bottom edge of the section.
  - the robot sits on `z-0`, **behind** the headline and buttons; the content
    layer is `pointer-events-none` with an inner `pointer-events-auto` wrapper
    so it stacks on top without stealing clicks from the buttons.
- **Expressions** — a small context (`RobotMood`) lets any button change the
  face, so expressions aren't hard-wired into the hero:
  - `idle` — resting outlined smile,
  - `surprised` — round "o" mouth. Runs on an ambient idle loop (2s on, 5s
    off) and is also triggered by **Contact Us** in the header. The loop pauses
    while any element is hovered and while the tab is hidden.
  - `happy` — big filled Doraemon-style pocket grin, squinted eyes and a
    ~1.55Hz "yes" nod, triggered by **Book a Consultation**.
  Mouth shapes crossfade with a springy `cubic-bezier(0.34, 1.56, 0.64, 1)`.
  - `prefers-reduced-motion` disables the loop entirely.
- **Cursor** — native cursor hidden; a blue dot follows exactly, with a lagging
  halo that scales up over interactive elements. Reverts to the native cursor
  on coarse/touch pointers.

## Colours

| Token | Value |
| --- | --- |
| `cream` (background) | `#F8F5F0` |
| `brand` (orange) | `#E1AD34` |
| `glass` (logo blue) | `#336678` — accents only |
| footer navy | `#12262F` |
| `ink` | `#1B1A17` |

## Approach section

- **Glass** — a frosted panel (`backdrop-blur(28px) saturate(180%)`) over three
  coloured blur blobs, so there is actually something to refract. Cards are a
  second, lighter glass layer on top.
- **Sticky left column** — pinned with `lg:sticky lg:top-32`.
  *Gotcha worth remembering:* `overflow-hidden` on **any** ancestor silently
  disables `position: sticky`. The section and panel therefore clip their
  decorative layers in dedicated inner wrappers instead.
- **Zig-zag line** — card anchors are **measured at runtime** (via
  `ResizeObserver` + `document.fonts.ready`) rather than hard-coded, so the
  path stays connected at any text length or viewport size. Anchors alternate
  between the two edges of a left-hand rail; corners are softened with
  quadratic curves. The draw uses `stroke-dasharray`/`dashoffset` on the
  measured `getTotalLength()`.
- **Progress** — derived from the cards' own centres crossing a line at 62% of
  the viewport, so it always reaches exactly 100% on the last card regardless
  of section height. Nodes and cards light up in sequence.
- **Responsive** — below `sm` the layout stacks and the diagonal is replaced by
  a slim vertical rail with the same fill animation.

## Projects section

- **Robot loop** — the supplied 21 MB / 240-frame GIF is re-encoded as
  **VP9 WebM with an alpha channel** (`public/robot-working.webm`, 635 KB) and
  played as an autoplaying, muted, inline, looping `<video>`. Identical result,
  34x lighter. The loop is trimmed to frame 224 (where it closes cleanly) and
  halved to 15 fps. `robot-working-poster.png` covers the first paint.

  To regenerate after editing the source GIF:
  ```bash
  # extract every 2nd frame up to the loop point, cropped to content
  ffmpeg -framerate 15 -i f%04d.png -c:v libvpx-vp9 \
         -pix_fmt yuva420p -b:v 0 -crf 40 -an robot-working.webm
  ```
- **Underline** — `Underline.tsx` draws itself with
  `stroke-dasharray`/`dashoffset` over the measured `getTotalLength()`, fired
  by `useReveal` when the section enters the viewport.
- **Reveals** — copy rises in on a stagger; Approach cards additionally
  un-blur (`blur(14px) -> 0`) as they scroll in.

## Glass palette

Both glass sections tint toward the brand blue `#316C88`, used at low opacity
(the `glass` scale in `tailwind.config.js`). Orange `#E1AD34` is reserved for
CTAs, numbers, the connector line and accents.

## Ways To Work section

- Two equal glass cards in a `md:grid-cols-2` grid with `items-stretch`, so
  both cards match height regardless of copy length. Inside each card the CTA
  is pushed down with `mt-auto`, which keeps both buttons on the same baseline
  (verified: identical `top` values with different-length descriptions).
- Hover lifts the card, brightens the border and blooms a warm amber wash from
  the top edge — the one place orange meets the blue glass.
- Each card's CTA also drives the hero robot's expression via `RobotMood`
  ("Drop Your Problem" -> surprised, "Book a Consultation" -> happy nod).

## Section labels

Section kickers use `Eyebrow.tsx` — plain uppercase type with a small dot and
rule, **not** a pill. The hero has no kicker at all; the headline leads.

## Brand assets

The supplied logo files were trimmed of their transparent padding and exported
at working sizes. Colours sampled from the artwork: blue `#336678`, orange
`#E3AA30` — the `glass` token was updated to the logo's exact blue so the
frosted sections match the mark.

Favicons (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`) were
generated from the square logo glyph and are committed directly.

## Quiz + Footer

- **Question mark** — a single continuous SVG stroke (hook + stem) drawn with
  `stroke-dasharray`/`dashoffset` on `getTotalLength()`, with the dot popping
  in on a spring once the stroke finishes. Fired by `useReveal` on scroll.
- **Footer** — `#12262F` navy with a diagonal sheen plus two blurred glows
  (warm amber top-left, brand blue bottom-right) for depth. Link hovers grow a
  small orange rule. The logo is tinted white with `brightness-0 invert`.
- **Year** is `new Date().getFullYear()`, so the copyright never goes stale.

## Glass palette

All frosted sections use a **warm amber/cream** glass built on the brand
orange `#E1AD34`. The logo blue is reserved for small accents (e.g. the footer
glow), keeping orange as the dominant surface tone.

## Deploying

The site is a static SPA — `npm run build` emits `dist/`, which can be served
by any static host.

| Host | Setting |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18.18+ |

Netlify / Vercel / Cloudflare Pages detect Vite automatically. For Hostinger or
plain Apache/Nginx, upload the **contents** of `dist/` to the web root.

### Node server

`server.js` (project root) is a small Express app that serves `dist/` and hosts
the API. Run it with `npm start` after `npm run build`. Requires **Node 18.18+**.

It is written in **CommonJS** on purpose. Passenger (Hostinger) loads the entry
file with `require()`, and Node 18 cannot `require()` an ES module — that
combination returns a 503 on boot. For the same reason `package.json` has no
`"type": "module"`; the PostCSS and Tailwind configs use `.mjs` so the Vite
build stays ESM.

### Backend readiness

There is no server yet — every CTA points at an in-page anchor. Everything a
backend would own is centralised in `src/config/site.ts`:

- contact email + phone,
- social links,
- booking / quiz / form destinations,
- `apiBaseUrl` for future form POSTs.

Copy `.env.example` to `.env` and fill in the values; components read them
through `site.ts`, so no component needs editing when the endpoints exist.

```bash
cp .env.example .env
```

When forms are added, POST to `` `${site.apiBaseUrl}/contact` `` and keep the
config file as the single source of truth.

## Animated underlines

Every hand-drawn rule on the site uses `Underline.tsx`, which measures its own
path with `getTotalLength()` (re-measuring on resize and after webfonts load)
and animates `stroke-dashoffset`. Each instance draws when its section scrolls
into view; the hero's fires on a short timer instead, since it is already
visible at load. `Eyebrow.tsx`'s small rule wipes out the same way.
