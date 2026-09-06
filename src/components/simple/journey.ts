/**
 * The robot's journey from the hero to its section-2 perch — one ramp shared
 * by SimplePage (position) and Robot3D (the 45° turn + gaze anchor), so pose
 * and position always finish together.
 *
 * Domain: the pre-pin scroll, 0 at the top of the page → 1 when section 2 is
 * fully in view (the pin starts). One long, gentle ramp that lasts the whole
 * way: the robot glides up-right while the page scrolls under it and lands
 * on its perch exactly as the section settles into place.
 */
export const HANDOFF_START = 0.12
export const HANDOFF_END = 0.97

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** 0 in the hero → 1 once the perch is reached */
export const handoff = (p: number) =>
  smoothstep(Math.max(0, Math.min(1, (p - HANDOFF_START) / (HANDOFF_END - HANDOFF_START))))
