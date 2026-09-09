/**
 * The robot's turn through the hero — one ramp shared by SimplePage and
 * Robot3D, so pose and position always agree.
 *
 * Domain: the hero scroll, 0 at the top of the page → 1 when the hero has
 * scrolled away. The robot stands on the right of the hero (under the type
 * on phones) and, as the visitor scrolls, turns a little toward the type
 * while it rides out with the hero — a gentle, monotonic ramp.
 */
export const TURN_START = 0.05
export const TURN_END = 0.9

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** 0 at rest → 1 fully turned */
export const handoff = (p: number) =>
  smoothstep(Math.max(0, Math.min(1, (p - TURN_START) / (TURN_END - TURN_START))))
